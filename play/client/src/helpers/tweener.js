import TWEEN from "@tweenjs/tween.js"

class Tweener {
    tweenTo = (from, to, timespan, update, complete) => {
        let tweenData = { val: from };
        this.animate();
        this.tween = new TWEEN.Tween(tweenData)
            .to({ val: to }, timespan)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                update(tweenData.val);
            })
            .onComplete(() => {
                complete(tweenData.val);
                this.tween = false
            })
            .start()
    }
    animate = (time) => {
        if (!this.tween) return;
        requestAnimationFrame(this.animate);
        TWEEN.update(time)
    }

    constructor() {
        this.animate();
        this.tween = false;
    }
}

export default Tweener