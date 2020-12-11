let WATERFLOWSIGPORT = 18;
let WATERFLOWFLAG = 1;
let WATERFLOWPALUSECNT = 2;

let WATERFLOWGetParamInterval = 1;
let WATERFLOWIsOnLimit = 700;

const waterflowGetter = class {
  constructor(pin, flag, debug = false) {
    /* コンストラクタ */
    this.pin = pin;
    this.flag = flag;
    this.flowPort = undefined;
    this.rate_cnt = -1;
    this.flowChkStartTimer = undefined;
    this._isFlow = false;
    this.previousPulse = -1;
    this.monitorElem = undefined;
    this.debug = debug;
    this.debugBtflow = undefined;
  }

  async getsensorParam() {
    const readgpio = await this.flowPort.read();
    const pulse = await (readgpio === 1 ? 1 : 0);

    if (this.monitorElem) {
      this.monitorElem.innerHTML = this._isFlow;
    }

    if (pulse !== this.previousPulse) {
      if (this.debug) {
        console.log("c:--rate_cnt: " + this.rate_cnt);
        console.log("c:--previousPulse: " + this.previousPulse);
        console.log("c:--pulse: " + pulse);
      }
      this.previousPulse = pulse;
      this.flowChkStartTimer = undefined;
      this.rate_cnt += 1;
    } else {
      //パルス変化なし
      if (!this.flowChkStartTimer) {
        this.flowChkStartTimer = new Date();
        this.flowChkStartTimer.setMilliseconds(
          this.flowChkStartTimer.getMilliseconds() + WATERFLOWIsOnLimit
        );
      }

      if (new Date().getTime() > this.flowChkStartTimer.getTime()) {
        if (this.debug) {
          console.log("c:flow check stop");
          console.log("c:--rate_cnt: " + this.rate_cnt);
        }
        this.flowChkStartTimer = undefined;
        this.rate_cnt = -1;
        this._isFlow = false;
        this.previousPulse = -1;
      }
    }

    if (this.rate_cnt >= WATERFLOWPALUSECNT) {
      if (this.debug) {
        console.log("c:now flow");
        console.log("c:--rate_cnt: " + this.rate_cnt);
      }
      this.rate_cnt = -1;
      this._isFlow = true;
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
    this.monitorElem = elem;
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

  isFlow() {
    return this._isFlow;
  }
};

//テスト用センサー値ダミークラス
class waterflowGetterDummy extends waterflowGetter {
  constructor(pin, flag, debug = false) {
    super(pin, flag, debug);
    this.debugelem = undefined;
    this.debugBtflow = document.getElementById("btflow");
    this.debugret = false;
    var _this = this;
    this.debugBtflow.onclick = () => {
      _this.debugBtflow.value = _this.debugBtflow.value == 0 ? 1 : 0;
      _this.debugret = this.debugBtflow.value == 1 ? true : false;
      if (_this.debugelem) _this.debugelem.innerHTML = _this.debugret;
    };
  }

  async getsensorParam() {
    return undefined;
  }
  async start(elem) {
    this.debugelem = elem;
    return undefined;
  }

  isFlow() {
    return this.debugret;
  }
}
