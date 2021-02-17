import TWEEN from "@tweenjs/tween.js"

class Tweener {
    tweenTo = (from, to, timespan, update, complete) => {
        let tweenData = {val: from};
        this.tween = new TWEEN.Tween(tweenData) 
            .to({val:to}, timespan)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                update(tweenData.val);
            })
            .onComplete(()=>{
                complete(tweenData.val);
            })
            .start() 
    }
    animate = (time) => {
        requestAnimationFrame(this.animate);
        TWEEN.update(time)
    }

    constructor() {
        this.animate();
    }
}

export default Tweener