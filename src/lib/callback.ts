/**
 * Created by EGomez on 3/2/17.
 */
import express = require('express');
import Request = express.Request;
import Response = express.Response;

export default class Callback {
  private _startTime: any = new Date();

  private _timeout = 3000; // Default 3000 miliseconds timeout

  get timeout(): number {
    return this._timeout;
  }

  set timeout(value: number) {
    // Convert to miliseconds
    this._timeout = value * 1000;
  }

  private _process;

  get process() {
    return this._process;
  }

  set process(value) {
    this._process = value;
  }

  /**
   * Thanks to https://github.com/motdotla/node-lambda for the implementation
   * @returns {number}
   */
  getRemainingTimeInMillis() {
    const currentTime: any = new Date();
    return this.timeout - (currentTime - this._startTime);
  }

  handler(error: Error, message?: any) {
    const response = this.getResponse(error, message);
    this.process.send(response);
    this.process.exit(0);
  }

  private getResponse(error: Error, message) {
    let errorResponse;
    if (error) {
      errorResponse = {
        message: error.message,
        name: error.name,
        stack: error.stack
      };
    } else {
      errorResponse = null;
    }
    return {
      timeout: false,
      error: errorResponse,
      message: message
    };
  }
}
