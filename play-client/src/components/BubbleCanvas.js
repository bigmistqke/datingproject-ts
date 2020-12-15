import paper from "paper";
import React, { useEffect, useRef } from 'react';



const BubbleCanvas = (props, ref) => {
    let current = {}
    
    current.canvas = useRef(null);

    const initPaper = (canvas) => {
        // current.canvas = canvas;
        current.paper = new paper.PaperScope();
        // current.paper.install(window);
        current.paper.setup(current.canvas.current);

        // current.paper.activate();
        drawBubble();
    }

    useEffect(() => {
        initPaper(this)
    }, [current.canvas]);
    const drawBubble = () => {

        current.paper.activate();
        switch (props.type) {
            case "think":
                drawThoughtBubble();
                break
            case "say":
                //console.log("DO T HIS");
                drawSpeechBubble();
                break
            case "do":
                drawActionBubble();
                break;
            case "wait":
                drawWaitBubble();
                break;
            case "empty":
                drawSpeechBubble();
                break;
            case "back":
                drawWaitBubble();
                break;
            default:
                drawWaitBubble();
                break;
        }
        current.paper.view.update();
        //console.log(current.paper);
    }

    function drawThoughtBubble() {

        let offset = 50 + Math.random() * 100;
        let innerEllipse = new current.paper.Path.Ellipse({
            center: current.paper.view.center,
            size: [current.paper.view.bounds.width - offset, current.paper.view.bounds.height - offset],
            fillColor: "#FFFFFF",
        });

        let amount = parseInt(innerEllipse.length / offset);

        for (let i = 0; i < amount; i++) {
            var point = innerEllipse.getPointAt(innerEllipse.length / amount * i);
            new current.paper.Path.Circle({
                center: point,
                radius: offset / 2,
                fillColor: '#FFFFFF'
            });
        }
    }

    function drawActionBubble() {
        // //console.log(current.canvas.bounds.width);

        let offset = current.paper.view.bounds.height / 10 + Math.random() * current.paper.view.bounds.height / 10;
        let innerEllipse = new current.paper.Path.Ellipse({
            center: current.paper.view.center,
            size: [current.paper.view.bounds.width - offset, current.paper.view.bounds.height - offset],
        });
        let outerEllipse = new current.paper.Path.Ellipse({
            center: current.paper.view.center,
            size: [current.paper.view.bounds.width, current.paper.view.bounds.height],
        });

        let amount = parseInt(Math.random() * 40 + 40);
        let points = [];

        for (let i = 0; i < amount; i++) {
            var point = innerEllipse.getPointAt(innerEllipse.length / amount * i);
            points.push(point);
            point = outerEllipse.getPointAt(outerEllipse.length / amount * i + (outerEllipse.length / (amount * 2)));
            points.push(point);
        }
        var path = new current.paper.Path(points);
        path.fillColor = '#FFFFFF';
        path.closed = true;
        // //console.log(path);

    }




    function drawWaitBubble() {
        // //console.log(current.canvas.bounds.width);

        let offset = current.paper.view.bounds.height / 10 + Math.random() * current.paper.view.bounds.height / 10;
        let width = current.paper.view.bounds.width - offset;
        let height = current.paper.view.bounds.height - offset;
        let result = false;
        let ellipse = new current.paper.Path.Ellipse({
            center: current.paper.view.center,
            size: [width, height],
            fillColor: "transparent"
        });
        for (let i = 0; i < 4; i++) {
            let boolean = ellipse.clone();
            let size = {};
            size.x = i >= 2 ? current.paper.view.bounds.width - offset / 2 : offset / 2;
            size.y = i % 2 === 0 ? current.paper.view.bounds.height - offset / 2 : offset / 2
            boolean.position = new paper.Point(size.x, size.y);
            boolean.fillColor = "transparent";
            // boolean.strokeColor = "black";

            if (result) {
                result = result.subtract(boolean);
            } else {
                result = ellipse.subtract(boolean);
            }
        }
        result.fillColor = "white";


    }

    function drawSpeechBubble() {
        // //console.log(current.canvas.bounds.width);

        let offset = current.paper.view.bounds.height / 20 + Math.random() * current.paper.view.bounds.height / 20;
        new current.paper.Path.Ellipse({
            center: current.paper.view.center,
            size: [current.paper.view.bounds.width - offset, current.paper.view.bounds.height - offset],
            fillColor: "#FFFFFF"
        });
    }


    return <canvas className="center" ref={current.canvas}></canvas>;
}

export default BubbleCanvas;