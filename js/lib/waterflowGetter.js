let WATERFLOWSIGPORT = 18;
let WATERFLOWFLAG = 1;
let WATERFLOWPALUSECNT = 3;

let WATERFLOWGetParamInterval = 10;
let WATERFLOWIsOnLimit = 700;

const waterflowGetter = class {
  constructor(pin, flag, debug = false) {
    /* コンストラクタ */
    this.pin = pin;
    this.flag = flag;
    this.flowPort = undefined;
    this.rate_cnt = 0;
    this.flowChkStartTimer = undefined;
    this.isFlow = false;
    this.previousPulse = 0;
    this.moniterElem = undefined;
    this.debug = debug;
  }

  async getsensorParam() {
    const readgpio = await this.flowPort.read();
    const pulse = await (readgpio === 1 ? 1 : 0);

    if (this.moniterElem) {
      this.moniterElem.innerHTML = this.isFlow;
    }

    if (!this.flowChkStartTimer) {
      if (pulse !== this.previousPulse) {
        this.rate_cnt = 1;
        this.flowChkStartTimer = new Date();
        this.flowChkStartTimer.setMilliseconds(
          this.flowChkStartTimer.getMilliseconds() + WATERFLOWIsOnLimit
        );
        this.previousPulse = pulse;
        if (this.debug) {
          console.log("c:flow check start");
        }
      }
    } else {
      if (new Date().getTime() > this.flowChkStartTimer.getTime()) {
        if (this.debug) {
          console.log("c:flow check stop");
          console.log("c:--rate_cnt: " + this.rate_cnt);
        }
        this.rate_cnt = 0;
        this.flowChkStartTimer = undefined;
        this.isFlow = false;
      } else if (new Date().getTime() <= this.flowChkStartTimer.getTime()) {
        if (pulse !== this.previousPulse) {
          if (this.debug) {
            console.log("c:pulse change");
            console.log("c:--rate_cnt: " + this.rate_cnt);
            console.log("c:--previousPulse: " + this.previousPulse);
            console.log("c:--pulse: " + pulse);
          }
          this.previousPulse = pulse;
          this.rate_cnt += 1;
        } else if (pulse === this.previousPulse) {
          if (this.debug) {
            console.log("c:pulse hold");
            console.log("c:--rate_cnt: " + this.rate_cnt);
            console.log("c:--previousPulse: " + this.previousPulse);
            console.log("c:--pulse: " + pulse);
          }
        }
      }
    }

    if (this.rate_cnt >= WATERFLOWPALUSECNT) {
      if (this.debug) {
        console.log("c:now flow");
        console.log("c:--rate_cnt: " + this.rate_cnt);
      }
      this.isFlow = true;
      this.previousPulse = -1;
      this.flowChkStartTimer = undefined;
    }

    window.setTimeout(
      await (() => {
        this.getsensorParam();
      }),
      WATERFLOWGetParamInterval
    );
  }

  async start(elem) {
    this.moniterElem = elem;
    const gpioAccess = await navigator.requestGPIOAccess(); // GPIO を操作する
    this.flowPort = gpioAccess.ports.get(this.pin);

    await this.flowPort.export("in");
    window.setTimeout(
      await (() => {
        this.getsensorParam();
      }),
      WATERFLOWGetParamInterval
    );
  }
};
