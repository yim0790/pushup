// 카메라 밝기값으로 푸쉬업 1회를 판정하는 순수 상태머신 (테스트 가능하게 분리)
(function (root) {
  // downRatio  : baseline(밝을 때) 대비 이 비율보다 어두워지면 '내려감'으로 판정
  // hysteresis : 다시 올라올 때 downRatio + hysteresis 비율을 넘어야 1회 인정 (떨림 방지)
  class RepCounter {
    constructor(opts) {
      opts = opts || {};
      this.downRatio = opts.downRatio != null ? opts.downRatio : 0.65;
      this.hysteresis = opts.hysteresis != null ? opts.hysteresis : 0.12;
      this.decay = opts.decay != null ? opts.decay : 0.995; // baseline 서서히 적응
      this.baseline = 0;
      this.state = 'up';
      this.count = 0;
    }

    reset() { this.count = 0; this.state = 'up'; }

    // 현재(멀리 있는) 밝기를 기준선으로 강제 설정
    calibrate(luma) { this.baseline = luma; this.state = 'up'; }

    // 매 프레임 밝기값(luma, 0~255) 입력. 이번 프레임에 1회가 완성되면 true 반환
    update(luma) {
      if (this.baseline === 0) this.baseline = luma;
      // baseline은 '밝은(멀리 있는) 상태' 수준을 추적. 조명 변화에 서서히 적응.
      this.baseline = Math.max(luma, this.baseline * this.decay);

      const downLevel = this.baseline * this.downRatio;
      const upLevel = this.baseline * (this.downRatio + this.hysteresis);

      let repDone = false;
      if (this.state === 'up' && luma < downLevel) {
        this.state = 'down';
      } else if (this.state === 'down' && luma > upLevel) {
        this.state = 'up';
        this.count++;
        repDone = true;
      }
      return repDone;
    }

    // UI 표시용: 현재 임계값과 진행 상태
    thresholds() {
      return {
        down: this.baseline * this.downRatio,
        up: this.baseline * (this.downRatio + this.hysteresis),
        baseline: this.baseline,
        state: this.state
      };
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = RepCounter;
  else root.RepCounter = RepCounter;
})(typeof window !== 'undefined' ? window : this);
