import Experience from "./Experience.js"; // Import Experience class

export default class Microphone {
  constructor() {
    this.experience = new Experience(); // Initialize Experience class
    this.debug = this.experience.debug;
    this.ready = false;
    this.volume = 0;
    this.levels = [];
    this.silenceThreshold = 0.01; // Volume level below which we consider as silence
    this.silenceTimeoutDuration = 2000; // 2 seconds of silence to stop recognition
    this.silenceTimeout = null; // Timeout handle for silence detection
    this.isWaitingForGroqResponse = false;

    // Initialize speech recognition if available
    if ("webkitSpeechRecognition" in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = true; // Keep recognizing as long as the user speaks
      this.recognition.interimResults = true; // Show intermediate results while speaking

      // Event listener for when the recognition starts
      this.recognition.onstart = () => {
        console.log("Speech recognition started.");
      };

      // Event listener for when recognition results are available
      this.recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        this.displayText(transcript); // Display the recognized text
        this.lastTranscript = transcript; // Store the last recognized transcript
        this.resetSilenceTimeout(); // Reset the silence timer
      };

      // Event listener for errors during recognition
      this.recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
      };

      // Event listener for when recognition ends
      this.recognition.onend = async () => {
        console.log("Speech recognition ended.");
        if (this.lastTranscript && !this.isWaitingForGroqResponse) {
          this.isWaitingForGroqResponse = true;
          await this.experience.llmCommunication.sendToGroq(
            this.lastTranscript
          );
          this.isWaitingForGroqResponse = false;
          this.startRecognition(); // Restart recognition after handling the response
        }
      };

      // Start speech recognition
      this.startRecognition();
    } else {
      console.warn("Speech recognition not supported in this browser.");
    }

    // Set up microphone stream
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((_stream) => {
        this.stream = _stream;
        this.init();

        if (this.debug) {
          this.setSpectrum();
        }
      });
  }

  init() {
    this.audioContext = new AudioContext();

    this.mediaStreamSourceNode = this.audioContext.createMediaStreamSource(
      this.stream
    );

    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;

    this.mediaStreamSourceNode.connect(this.analyserNode);

    this.floatTimeDomainData = new Float32Array(this.analyserNode.fftSize);
    this.byteFrequencyData = new Uint8Array(this.analyserNode.fftSize);

    this.ready = true;
  }

  // Start recognition and resume the audio context (AnalyserNode)
  startRecognition() {
    if (this.recognition && this.recognition.state !== "started") {
      this.recognition.start();
      // Ensure audioContext is available before resuming
      if (this.audioContext && this.audioContext.state !== "running") {
        this.audioContext
          .resume()
          .then(() => {
            console.log("Audio context resumed.");
          })
          .catch((error) => {
            console.error("Error resuming audio context:", error);
          });
      } else {
        console.log("Audio context is already running or not available.");
      }
      console.log("Speech recognition restarted.");
    }
  }

  // Stop recognition and pause the audio context (AnalyserNode)
  stopRecognition() {
    if (this.recognition) {
      this.recognition.stop(); // Stop recognition manually
      console.log("Speech recognition manually stopped.");

      // Ensure audioContext is initialized before attempting to suspend it
      if (this.audioContext && this.audioContext.state !== "suspended") {
        this.audioContext
          .suspend()
          .then(() => {
            console.log("Audio context suspended.");
          })
          .catch((error) => {
            console.error("Error suspending audio context:", error);
          });
      } else {
        console.warn("Audio context is not initialized or already suspended.");
      }
    }
  }

  // Reset silence timeout
  resetSilenceTimeout() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout); // Clear existing timeout
    }
    this.silenceTimeout = setTimeout(() => {
      console.log("No speech detected for 2 seconds, stopping recognition.");
      this.stopRecognition();
    }, this.silenceTimeoutDuration); // Set the timeout for silence detection
  }

  setSpectrum() {
    this.spectrum = {};

    this.spectrum.width = this.analyserNode.fftSize;
    this.spectrum.height = 128;
    this.spectrum.halfHeight = Math.round(this.spectrum.height * 0.5);

    this.spectrum.canvas = document.createElement("canvas");
    this.spectrum.canvas.width = this.spectrum.width;
    this.spectrum.canvas.height = this.spectrum.height;
    this.spectrum.canvas.style.position = "fixed";
    this.spectrum.canvas.style.left = 0;
    this.spectrum.canvas.style.bottom = 0;
    document.body.append(this.spectrum.canvas);

    this.spectrum.context = this.spectrum.canvas.getContext("2d");
    this.spectrum.context.fillStyle = "#ffffff";

    this.spectrum.update = () => {
      this.spectrum.context.clearRect(
        0,
        0,
        this.spectrum.width,
        this.spectrum.height
      );

      for (let i = 0; i < this.analyserNode.fftSize; i++) {
        const byteFrequencyValue = this.byteFrequencyData[i];
        const normalizeByteFrequencyValue = byteFrequencyValue / 255;

        const x = i;
        const y =
          this.spectrum.height -
          normalizeByteFrequencyValue * this.spectrum.height;
        const width = 1;
        const height = normalizeByteFrequencyValue * this.spectrum.height;

        this.spectrum.context.fillRect(x, y, width, height);
      }
    };
  }

  getLevels() {
    const bufferLength = this.analyserNode.fftSize;
    const levelCount = 8;
    const levelBins = Math.floor(bufferLength / levelCount);

    const levels = [];
    let max = 0;

    for (let i = 0; i < levelCount; i++) {
      let sum = 0;

      for (let j = 0; j < levelBins; j++) {
        sum += this.byteFrequencyData[i * levelBins + j];
      }

      const value = sum / levelBins / 256;
      levels[i] = value;

      if (value > max) max = value;
    }

    return levels;
  }

  getVolume() {
    let sumSquares = 0.0;
    for (const amplitude of this.floatTimeDomainData) {
      sumSquares += amplitude * amplitude;
    }

    return Math.sqrt(sumSquares / this.floatTimeDomainData.length);
  }

  update() {
    if (!this.ready) return;

    // Retrieve audio data
    this.analyserNode.getByteFrequencyData(this.byteFrequencyData);
    this.analyserNode.getFloatTimeDomainData(this.floatTimeDomainData);

    this.volume = this.getVolume();
    this.levels = this.getLevels();

    // Spectrum
    if (this.spectrum) this.spectrum.update();

    // Trigger recognition based on volume (if the user is speaking)
    if (this.volume > this.silenceThreshold && !this.recognition.running) {
      console.log("User speaking, restarting recognition...");
      this.startRecognition(); // Restart recognition automatically when the user speaks
    }

    // Check for silence and reset timeout if needed
    if (this.volume < this.silenceThreshold) {
      this.resetSilenceTimeout();
    }
  }

  // Function to display recognized speech as text in the DOM
  displayText(text) {
    const outputElement = document.getElementById("speech-output");
    if (outputElement) {
      outputElement.textContent = `User Input: ${text}`;
    }
  }
}
