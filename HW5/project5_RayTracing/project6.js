let raytraceFS;

async function main() {
	raytraceFS = await InitFragmentShaderProg();
	console.log("Shader is ready");
}

main();

async function InitFragmentShaderProg() {
	async function loadShaderFile(url) {
		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
			return await response.text();
		} catch (error) {
			console.error('Error loading shader:', error);
			return null;
		}
	}

	let fs_source = await loadShaderFile("shaders/fragment.glsl");

	if (!fs_source) {
		console.error("Failed to load fragment shader source code");
	}
	console.log("Fragment shader loaded successfully.");
	return  fs_source;
}
