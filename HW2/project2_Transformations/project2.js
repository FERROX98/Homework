// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{

	// radians
	rotation = rotation * Math.PI / 180;

	// 0, 3, 6, 1, 4, 7, 2, 5, 8
	let transformationMatrix = Array( 1, 0, 0, 0, 1, 0, 0, 0, 1);
	
	// Scale 
	let scaleMatrix = Array( scale, 0 , 0, 0, scale, 0, 0, 0, 1 );
	
	// Rotation
	let rotationMatrix = Array( Math.cos(rotation), Math.sin(rotation), 0, -Math.sin(rotation), Math.cos(rotation), 0, 0, 0, 1); 
	
	// Translation 
	// the last element is 0 for direction vector
	let translationMatrix = Array(0, 0, 0, 0, 0, 0, positionX, positionY, 0); 

	for (let j = 0; j < transformationMatrix.length/3; j++){
		for (let i = 0 ; i < transformationMatrix.length ; i+=3){

			transformationMatrix[j+i] = (rotationMatrix[j] * scaleMatrix[i] + rotationMatrix[j+3] * scaleMatrix[i+1] + rotationMatrix[j+6] * scaleMatrix[i+2]) + translationMatrix[i+j];
		}
	}

	return transformationMatrix;
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{
	let transformationMatrix = Array( 1, 0, 0, 0, 1, 0, 0, 0, 1);

	for (let j = 0; j < transformationMatrix.length/3; j++){
		for (let i = 0 ; i < transformationMatrix.length ; i+=3){
	
				transformationMatrix[j+i] = (trans2[j] * trans1[i] + trans2[j+3] * trans1[i+1] + trans2[j+6] * trans1[i+2]); 
			}
		}

	return transformationMatrix;
}
