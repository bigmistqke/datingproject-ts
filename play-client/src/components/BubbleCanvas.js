import paper from "paper";
import { useEffect } from 'react';
const BubbleCanvas = (props, ref) => {
    window.onload = function () {
        paper.install(window);
        paper.setup("paper-canvas");
    };
    useEffect(() => {
        console.log(props.type);
        switch (props.type) {
            case "think":
                drawThoughtBubble();
                break
            case "say":
                console.log("DO T HIS");
                drawSpeechBubble();
                break
            case "do":
                drawActionBubble();
                break;
            case "wait":
                paper.project.clear();
                break;
        }

    }, [props.type]);

    function drawThoughtBubble() {
        let offset = 50 + Math.random() * 100;
        let innerEllipse = new paper.Path.Ellipse({
            center: paper.view.center,
            size: [paper.view.bounds.width - offset, paper.view.bounds.height - offset],
            fillColor: "#FFFFFF",
        });

        let amount = parseInt(innerEllipse.length / offset);

        for (let i = 0; i < amount; i++) {
            var point = innerEllipse.getPointAt(innerEllipse.length / amount * i);
            var circle = new paper.Path.Circle({
                center: point,
                radius: offset / 2,
                fillColor: '#FFFFFF'
            });
        }
    }

    function drawActionBubble() {

        let offset = paper.view.bounds.height / 5 + Math.random() * paper.view.bounds.height / 5;
        let innerEllipse = new paper.Path.Ellipse({
            center: paper.view.center,
            size: [paper.view.bounds.width - offset, paper.view.bounds.height - offset],
        });
        let outerEllipse = new paper.Path.Ellipse({
            center: paper.view.center,
            size: [paper.view.bounds.width, paper.view.bounds.height],
        });

        let amount = parseInt(Math.random() * 40 + 40);
        let points = [];

        for (let i = 0; i < amount; i++) {
            var point = innerEllipse.getPointAt(innerEllipse.length / amount * i);
            points.push(point);
            point = outerEllipse.getPointAt(outerEllipse.length / amount * i + (outerEllipse.length / (amount * 2)));
            points.push(point);
        }
        var path = new paper.Path(points);
        path.fillColor = '#FFFFFF';
        path.closed = true;
        console.log(path);

    }






    function drawSpeechBubble() {
        let offset = paper.view.bounds.height / 10 + Math.random() * paper.view.bounds.height / 10;
        let innerEllipse = new paper.Path.Ellipse({
            center: paper.view.center,
            size: [paper.view.bounds.width - offset, paper.view.bounds.height - offset],
            fillColor: "#FFFFFF"
        });
    }


    return null;
}

export default BubbleCanvas;