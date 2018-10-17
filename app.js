// isolate env
let setupBlob = ((window)=>{

	//define Dot class
	class Dot {
		constructor(center, radius, angle) {

			this.center = center;
			this.angle = angle;
			this.radius = radius;

			this.friction = 0.0085;
			this.elasticity = 0.0001;

			this._coordinate = {
				x: center.x + Math.cos(radian*angle)*radius,
				y: center.y + Math.sin(radian*angle)*radius
			};

			this._speed = 0;
			this._acceleration = 0;
			this._radialEffect = 0.001;

			//init shake
			this.acceleration = -0.3 + Math.random() * 0.5;

		}

		solveWith(preDot, nextDot) {
			this.acceleration = (-0.3 * this.radialEffect +
					(preDot.radialEffect - this.radialEffect) +
					(nextDot.radialEffect - this.radialEffect)) *
					this.elasticity - this.speed * this.friction;
		}

		get coordinate() {
			return {
				x: this._coordinate.x * (1 + this.radialEffect/this.radius),
				y: this._coordinate.y * (1 + this.radialEffect/this.radius)
			};
		}

		get radialEffect() {
			return this._radialEffect || 0.001;
		}

		get acceleration() {
			return this._acceleration || 0;
		}

		set acceleration(value) {
			if (isNaN(value)) {return}
			this._acceleration = value;
			this.speed = this.speed + this.acceleration * controls.speed;
		}

		get speed() {
			return this._speed || 0;
		}

		set speed(value) {
			if (isNaN(value)) {return}
			this._speed = value;
			this._radialEffect += this._speed * controls.bounce;
		}

	};

	//const var
	const radian = Math.PI/180;
	const canvas = document.getElementById("mycanvas");
	const ctx = canvas.getContext('2d');

	//var
	let center = {x: 0, y: 0};
	let preMovePoint = {x: 0, y:0};
	let isHover = false;
	let baseDots = [];
	let renderLoop;

	//param controller
	let controls = {
		angle: 0,
		radius: 100,
		polys: 32,
		bounce: 2,
		speed: 5,
		animation_on: true,
		show_points: false,
		gradient_start: "#3f2c75",
		gradient_03: "#a20d82",
		gradient_07: "#e53829",
		gradient_end: "#c7973f"
	};



    //utitlty function
	let calDistance = (point1, point2) => {
		tempVect = {
			x: point1.x - point2.x,
			y: point1.y - point1.y
		};
		return Math.sqrt(Math.pow(tempVect.x, 2) + Math.pow(tempVect.y, 2)) / 1000;
	};

    let xyToDeg = (x,y) => {
        deg = Math.atan2(y,x)/Math.PI*180

        if(0 > deg && deg > -180){
            return deg+360;
        }else{
            return deg
        }
    };

	let setupGUI = () => {
		//apply gui
		let gui = new dat.GUI();
		gui.add(controls, "radius", 20, 300).step(1).onChange(() => {
			setupPoints();
		});
		gui.add(controls, "polys", 3, 32).step(1).onChange(() => {
			setupPoints();
		});
		gui.add(controls, "bounce", 1, 5);
		gui.add(controls, "speed", 1, 20);
		gui.add(controls, "animation_on").onChange((value) => {
			if (value) {
				render();
			} else {
				cancelAnimationFrame(renderLoop);
			}
		});
		gui.add(controls, "show_points");
		gui.addColor(controls, "gradient_03");
		gui.addColor(controls, "gradient_07");
		gui.close();
	};

	let setupCanvas = () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	};

	let setupPoints = () => {
		baseDots = [];
		let angleSpan = 360 / controls.polys;
		for (var i = 0; i < controls.polys; i++) {
			let degree = angleSpan*i;
			baseDots.push(
				new Dot(center, controls.radius, degree)
			);
		}
	};

	let render = () => {

		let ww = canvas.width;
		let wh = canvas.height;
		let drawPoints = [];

		ctx.fillStyle = "#123456";
		ctx.fillRect(0, 0, ww, wh);
		ctx.save();

		ctx.translate(canvas.width/2, canvas.height/2);

		//effect logic
		baseDots.forEach((o, idx) => {
			let preDot;
			let nextDot;
			if (idx == 0) {
				preDot = baseDots[baseDots.length-1];
				nextDot = baseDots[idx+1];
			}
			else if (idx == baseDots.length -1) {
				preDot = baseDots[idx-1];
				nextDot = baseDots[0];
			} else {
				preDot = baseDots[idx-1];
				nextDot = baseDots[idx+1];
			}
			o.solveWith(preDot, nextDot);
		});

		//gen draw point
		baseDots.forEach((o, idx) => {
			let currentPoint = o.coordinate;
			let nextPoint;
			if (idx == baseDots.length -1) {
				nextPoint = baseDots[0].coordinate;
			} else {
				nextPoint = baseDots[idx+1].coordinate;
			}
			drawPoints.push({
				x:(currentPoint.x + nextPoint.x)/2,
				y:(currentPoint.y + nextPoint.y)/2
			});
		});

		//set qq color
		var fillGradient = ctx.createLinearGradient(-ww / 2, wh / 2, ww / 2, -wh / 2);
		fillGradient.addColorStop(0, controls.gradient_start);
		fillGradient.addColorStop(0.3, controls.gradient_03);
		fillGradient.addColorStop(0.7, controls.gradient_07);
		fillGradient.addColorStop(1, controls.gradient_end);
		ctx.fillStyle = fillGradient;

		//draw qq
		ctx.beginPath();
		ctx.moveTo(drawPoints[0].x, drawPoints[0].y);
		drawPoints.forEach((o, idx) => {
			let currentPoint = o.coordinate;
			let nextPoint;
			let midPoint;
			if (idx == drawPoints.length -1) {
				nextPoint = drawPoints[0];
				midPoint = baseDots[0].coordinate;
			} else {
				nextPoint = drawPoints[idx+1];
				midPoint = baseDots[idx+1].coordinate;
			}
			ctx.quadraticCurveTo(
				midPoint.x,
				midPoint.y,
				nextPoint.x,
				nextPoint.y
			);
		});
		ctx.closePath();
		ctx.fill();

		//show points
		if (controls.show_points) {

			ctx.font = '15px Helvetica'

			ctx.fillStyle = "white";
			ctx.beginPath();
			ctx.arc(0, 0, 3, 0, Math.PI * 2);
			ctx.fill();
			ctx.closePath();

			//draw points
			baseDots.forEach((o, idx) => {

				let idxTextSize = ctx.measureText(`${idx}`);
				let textWidth = idxTextSize.width;
				let textHeight = 15*3/4;

				let oDis = Math.sqrt(Math.pow(o.coordinate.x, 2) + Math.pow(o.coordinate.y, 2));
				let textCoordinate = {
					x: o.center.x + Math.cos(radian*o.angle)*(oDis+15) - textWidth/2,
					y: o.center.y + Math.sin(radian*o.angle)*(oDis+15) + textHeight/2
				};

				//base point & index
				ctx.fillStyle = "white";
				ctx.beginPath();
				ctx.arc(o.coordinate.x, o.coordinate.y, 2, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillText(`${idx}`, textCoordinate.x , textCoordinate.y);
				ctx.closePath();

				//draw point
				ctx.beginPath();
				ctx.fillStyle = "yellow";
				ctx.arc(drawPoints[idx].x, drawPoints[idx].y, 3, 0, Math.PI * 2);
				ctx.fill();
				ctx.closePath();

			});

			//drow base line
			ctx.beginPath()
			ctx.strokeStyle = "white";
			ctx.lineWidth = 1;
			baseDots.forEach((o, idx) => {
				if (idx == 0) {
					ctx.moveTo(o.coordinate.x, o.coordinate.y);
				} else {
					ctx.lineTo(o.coordinate.x, o.coordinate.y);
				}
				if (idx == baseDots.length - 1) {
					ctx.lineTo(baseDots[0].coordinate.x, baseDots[0].coordinate.y);
				}
			});
			ctx.stroke();
			ctx.closePath();

		}

		ctx.restore();

		renderLoop = requestAnimationFrame(render);

	};


	let moveHandler = function(e) {
		let ww = canvas.width;
		let wh = canvas.height;

		let pos = {
			x: ww / 2,
			y: wh / 2
		};

		let movePoint;

		if (e.type == "mousemove") {
			movePoint = {
				x: e.clientX,
				y: e.clientY
			}
		} else if (e.type == "touchmove") {
			movePoint = {
				x: e.changedTouches[0].clientX,
				y: e.changedTouches[0].clientY
			}
		} else {
			return;
		}

		let diff = {
			x: movePoint.x - pos.x,
			y: movePoint.y - pos.y
        };

		let dist = Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2));
		let angle;
		let statusChange = false;
		if (dist < controls.radius && isHover == false) {
			let vector = {
				x: movePoint.x - pos.x,
				y: movePoint.y - pos.y
			};
			angle = Math.atan2(vector.y, vector.x);
			isHover = true;
		} else if (dist > controls.radius && isHover == true) {
			let vector = {
				x: e.clientX - pos.x,
				y: e.clientY - pos.y
			};
			angle = Math.atan2(vector.y, vector.x);
			isHover = false;
		}

		if (angle) {
			let touchpoint = {
				x: movePoint.x - ww / 2,
				y: movePoint.y - wh / 2
			};

			let nearestPoint;
			let nearestDistance = 100;

            // calculate by distance, but will have problem when using 2d coordinate ex: (1,0) => 0 deg
			// baseDots.forEach((o, idx) => {
            //     let distanceToTouchpoint = calDistance(o.coordinate, touchpoint);
			// 	if (distanceToTouchpoint < nearestDistance) {
			// 		nearestPoint = o;
            //         nearestDistance = distanceToTouchpoint;
            //         nearestPointId = idx;
			// 	}
            // });

            nearestPointId = Math.floor((xyToDeg(touchpoint.x, touchpoint.y)+(360/controls.polys/2))%360/(360/controls.polys))
            nearestPoint = baseDots[nearestPointId];

			if (nearestPoint) {
				let strengthVec = {
					x: preMovePoint.x - movePoint.x,
					y: preMovePoint.y - movePoint.y
				};

				let strength = Math.sqrt(Math.pow(strengthVec.x, 2) + Math.pow(strengthVec.y, 2)) * 1;
				if (strength > 30) {
					strength = 30;
				}
				nearestPoint.acceleration = strength / 70 * (isHover ? -1 : 1);
			}
		}

		preMovePoint.x = movePoint.x;
		preMovePoint.y = movePoint.y;

	};

	setupCanvas();
	setupPoints();
	setupGUI();
	render();

	window.addEventListener("resize", setupCanvas);

	window.addEventListener("mousemove", (e) => {
		moveHandler(e);
	});

	window.addEventListener("touchmove", (e) => {
		moveHandler(e);
	});

});

window.addEventListener('load', ()=>{
	setupBlob(window);
});

document.body.addEventListener('touchmove', function (e) {
	e.preventDefault(); //阻止默認的處理方式(阻止下拉滑動的效果)
}, {passive: false});