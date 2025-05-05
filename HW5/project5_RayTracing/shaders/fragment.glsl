
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{

	vec3 color = vec3(0,0,0);

	vec3 viewVectorNormalized = normalize(view);
	vec3 normalNormalized = normalize(normal);

	float ambientLightIntensity = 0.0055;
	vec3 lightColor = vec3(1.0);
	float shininess = mtl.n;

  	// Ambient term
	vec3 ambientTerm = mtl.k_d * lightColor *  ambientLightIntensity;

	for ( int i=0; i<NUM_LIGHTS; ++i ) {
		
		// Shadow ray 
		Ray d;
		d.dir = normalize( lights[i].position - position ); 
		d.pos = position;

		HitInfo hit;
		hit.t = -1e30;

		if ( (IntersectRay( hit, d ) ) || (dot(normalNormalized, d.dir) == 0.0) ) {
				color += ambientTerm; // shadowed
		} else {
			// TO-DO: If not shadowed, perform shading using the Blinn model

			vec3 lightIntensity = lights[i].intensity;
			vec3 lightDirection = d.dir;
			
			vec3 lightDirectionNormalized = normalize(lightDirection);

			// compute Geometry term
			float cosTheta =  max(0.0,dot(normalNormalized, lightDirectionNormalized));
		
			// Diffuse term
			vec3 diffuseTerm = lightIntensity * mtl.k_d * cosTheta;
			
			// Specular term
			vec3 h = normalize(lightDirectionNormalized + viewVectorNormalized);
			float cosPhi =  max(0.0,dot(h, normalNormalized));
			vec3 specularTerm = lightIntensity *  mtl.k_s * pow(cosPhi, shininess);

			color += (ambientTerm + diffuseTerm + specularTerm);	
        }
	}
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	bool foundHit = false;
	for ( int i=0; i<NUM_SPHERES; ++i ) {
		// TO-DO: Test for ray-sphere intersection
		Sphere sphere = spheres[i];
		vec3 center = sphere.center;
		float radius = sphere.radius;
		vec3 oc = ray.pos - center;

		float a = dot(ray.dir, ray.dir);
		float b = 2.0 * dot(ray.dir, oc);
		float c = dot(oc, oc) - radius * radius;

		float discriminant = b * b - 4.0 * a * c;
		if (discriminant >= 0.0) {
			
			foundHit = true;
			float t = (-b - sqrt(discriminant)) / (2.0 * a);
			if (t > hit.t) {
				// TO-DO: If intersection is found, update the given HitInfo

				hit.t = t;
				hit.position = ray.pos + t * ray.dir;
				// https://stackoverflow.com/questions/8024898/calculate-the-vertex-normals-of-a-sphere
				hit.normal = normalize(hit.position - sphere.center); 
				hit.mtl = sphere.mtl;
			} 
		}
	}
	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info
			
			// TO-DO: Initialize the reflection ray
			
			if ( IntersectRay( h, r ) ) {
				// TO-DO: Hit found, so shade the hit point
				// TO-DO: Update the loop variables for tracing the next reflection ray
			} else {
				// The refleciton ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
	}
}
