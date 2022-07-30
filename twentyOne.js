/* 	nowy teren, szum w zależności od wysokości
		kolor zależny od wysokości i falująca woda
*/
// scena i kamera
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.01, 50);
	camera.position.set(12.5, 2, 5);
	camera.lookAt(5,1,5);

// renderer
	const renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0xffffff);
	document.body.appendChild(renderer.domElement);

// punkty
	const nPoints = 10;
	const gradient = [];
	const planePoints = [];

// wypełnianie gradientu 2d
	for (var i = 0; i < nPoints + 1; i++) {
		var row = [];
		for (var j = 0; j < nPoints + 1; j++) {
			row.push(randomUnitVector());
		}
		gradient.push(row);
	}

// tablica punktów z użyciem szumu Perlina
		var max = 0;
		var min = 0;

		var length = 0;
		for (var i = 0; i < nPoints - 0.05; i += 0.1) {
			for (var j = 0; j < nPoints - 0.05; j += 0.1) {
				var yValue = 0;
				yValue = perlinNoise(i, j);
				yValue += 0.5 * perlinNoise(i*2 % 10, j*2 % 10);
				yValue += 0.25 * perlinNoise(i*4 % 10, j*4 % 10);
				yValue += 0.125 * perlinNoise(i*8 % 10, j*8 % 10);
				if (max < yValue) max = yValue;
				if (min > yValue) min = yValue;
				planePoints.push(new THREE.Vector3(i, (yValue), j));
			}
			length++;
		}

	const geometry = new THREE.PlaneGeometry(10, 10, length-1, length-1);
	geometry.setFromPoints(planePoints);
	geometry.computeVertexNormals();

	const count = geometry.attributes.position.count;  // może być length
	var buffer = new THREE.BufferAttribute(new Float32Array(count *3), 3);
	geometry.setAttribute('color', buffer);

// kolorowanie wysokości
	for (var i = 0; i < count; i++) {
		var red, green, blue;
		var height = planePoints[i].y;
		if (height < -0.03) {
			red = 0;
			green = 0;
			blue = 1 - height / min;
		}
		else {
			if (height < 0.15 * max) {
				red = 0.8;
				green = 0.8;
				blue = 0;
			}
			else {
				if (height < 0.8 * max) {
					red = 0;
					green = 1 - height / max;
					blue = 0;
				}
				else {
					red = 1;
					green = 1;
					blue = 1;
				}
			}
		}
		geometry.attributes.color.setXYZ(i, red, green, blue);
	}


	const planeMaterial = new THREE.MeshPhysicalMaterial({vertexColors: THREE.VertexColors});//color:0x959595});//, wireframe: true});
	planeMaterial.side = THREE.DoubleSide;

	const plane = new THREE.Mesh(geometry, planeMaterial);
	scene.add(plane);

// woda - falująca płaszczyzna
	const waterPoints = [];
	const waterLength = 11
	for (var i = 0; i < waterLength; i++) {
		for (var j = 0; j < waterLength; j++) {
			waterPoints.push(new THREE.Vector3(i, 0, j));
		}
	}

	const waterGeom = new THREE.PlaneGeometry(10,10, waterLength-1, waterLength-1);
	waterGeom.setFromPoints(waterPoints);
	waterGeom.computeVertexNormals();

	const waterMat = new THREE.MeshPhysicalMaterial({color:0x0000aa, roughness: 0.14, transmission: 0.95, thickness: 1.8,});
	waterMat.side = THREE.DoubleSide;
	const wg = new THREE.Mesh(waterGeom, waterMat);
	scene.add(wg);

// chmurki
	const cloudsPoints = [];
	const cloudsLength = 10;
	var counter = 0
	for (var i = 0; i < (cloudsLength - 0.05); i += 0.1) {
		for (var j = 0; j < (cloudsLength - 0.05); j += 0.1) {
			cloudsPoints.push(new THREE.Vector3(i, 0.8*max, j));  //tak aby szczyty przechodziły przez chmurki
		}
		counter++;
	}

	const cloudsGeometry = new THREE.PlaneGeometry(10,10, counter -1, counter -1);
	cloudsGeometry.setFromPoints(cloudsPoints);

	const cloudsCount = cloudsGeometry.attributes.position.count;
	var cloudsBuffer = new THREE.BufferAttribute(new Float32Array(cloudsCount * 3),3);
	cloudsGeometry.setAttribute('color', cloudsBuffer);

	console.log("counter " + counter + " cloudsCount " + cloudsCount);
	for (var i = 0; i < cloudsCount; i++) {
		var row = i % counter;
		for (var j = 0; j < counter; j++) {
			var y = Math.abs(perlinNoise(row/counter, j/counter) * 5);
			y +=  Math.abs(perlinNoise(row*2 %10, j*2 %10));
			y +=  Math.abs(perlinNoise(row*4 %10, j*4 %10));;
			cloudsGeometry.attributes.color.setXYZ(row*counter + j , y, y, y);
		}
	}

	const cloudsMat = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors});
	cloudsMat.side = THREE.DoubleSide;
	cloudsMat.transparent = true;
	cloudsMat.opacity = 0.7;
	const cm = new THREE.Mesh(cloudsGeometry, cloudsMat);
	scene.add(cm);

// oświetlenie
	var light = new THREE.DirectionalLight(0xffffff);
	light.position.set(0,4,0);
	scene.add(light);
//	var light2 = new THREE.HemisphereLight(0xf4f4f4, 0x858585, 1);
//	scene.add(light2);


// animacja
	var alpha = 0;
	var beta = 0;
	function animate() {

		alpha += 0.001;
		beta += 0.01;
		requestAnimationFrame(animate);
		var vLength = wg.geometry.attributes.position.count; //console.log(vLength);
		for (var i = 0; i < vLength; i++) {
			var y = 0.075 * Math.sin(wg.geometry.attributes.position.getX(i) + beta);
			wg.geometry.attributes.position.setY(i, y);
			}
		wg.geometry.attributes.position.needsUpdate = true;

		camera.position.x = 2 + 7.5 * Math.cos(alpha);
		camera.position.z = 2 + 7.5 * Math.sin(alpha);
		camera.lookAt(5,1,5);
		renderer.render(scene, camera);
	}
	animate();

function randomUnitVector() {
	var theta = Math.random() * 2 * Math.PI;
	return { x: Math.cos(theta), y: Math.sin(theta)};
}


function perlinNoise(x, y) {
	var x0 = Math.floor(x);
	var x1 = x0 + 1;
	var y0 = Math.floor(y);
	var y1 = y0 + 1;

	var sx = x - x0;
	var sy = y - y0;

	var n0, n1, ix0, ix1, intensity;
	n0 = dotProductGrid(x0, y0, x, y);
	n1 = dotProductGrid(x1, y0, x, y);
	ix0 = linInterp(n0, n1, sx);

	n0 = dotProductGrid(x0, y1, x, y);
	n1 = dotProductGrid(x1, y1, x, y);
	ix1 = linInterp(n0, n1, sx);
	intensity = linInterp(ix0, ix1, sy);

	return intensity;
}

function randomUnitVector() {
	var theta = Math.random() * 2 * Math.PI;
	return { x: Math.cos(theta), y: Math.sin(theta)};
}

function dotProductGrid(x, y, wx, wy) {
//	console.log("y= " + y, "x= " + x);
	var gVector = gradient[y][x];
	var dVector = {x: wx - x, y: wy - y};
	return gVector.x * dVector.x + gVector.y * dVector.y;
}

function linInterp(a0, a1, w) {
	//	return (1 - w)*a0 + w * a1;
	return a0 + smootherStep(w) * (a1-a0);
}

function smootherStep(x) {
	return 6 * x**5 - 15 * x**4 + 10 * x**3;
}
