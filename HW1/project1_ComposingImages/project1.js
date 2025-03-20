// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {

    let fgWidth = fgImg.width;
    let fgHeight = fgImg.height;

    // Ref to position on bg image to blend
    let fgX = fgPos.x;
    let fgY = fgPos.y;

    let bgWidth = bgImg.width;
    let bgHeight = bgImg.height;

    if ((fgX< 0 && Math.abs(fgX) >= fgWidth) || (fgY<0 && Math.abs(fgY) >= fgHeight) || fgX >= bgWidth || fgY >= bgHeight) {
         console.log("fgPos is out of bounds");
        return;
    }

    // Ref to position on fg image to blend
    let blendXpos = 0;
    let blendYpos = 0;

    if (fgX < 0) {
        
        blendXpos = fgX * -1;
        fgX = 0;
    }
    
    if (fgY < 0) {
        blendYpos = fgY * -1;
        fgY = 0;
    }

    let currFgX = 0;
    let currFgY = 0;

    let currBgX = fgX;
    let currBgY = fgY;

    for (currFgY = blendYpos;  currFgY < blendYpos + Math.min(fgHeight - blendYpos, bgHeight - fgY); currFgY++) {
        
        for (currFgX = blendXpos;  currFgX < blendXpos + Math.min(fgWidth - blendXpos, bgWidth - fgX) ; currFgX++) {

            fgRed = fgImg.data[currFgY * fgWidth * 4 + currFgX * 4];
            fgGreen = fgImg.data[currFgY * fgWidth * 4 + currFgX * 4 + 1];
            fgBlue = fgImg.data[currFgY * fgWidth * 4 + currFgX * 4 + 2];
            fgAlpha = fgImg.data[currFgY * fgWidth * 4 + currFgX * 4+ 3]/255;
            
            let indexBg = currBgY * bgWidth * 4 + currBgX * 4 ; 
            // Blend with background
            if ((indexBg + 3 )< bgImg.data.length) {
                
                // Normalized 
                bgAlpha =  bgImg.data[indexBg + 3] / 255; 
                blendedAlpha = (fgOpac * fgAlpha + bgAlpha * (1 - fgAlpha * fgOpac));
                bgImg.data[indexBg + 3] =  blendedAlpha * 255; 
                
                // Red 
                bgImg.data[indexBg] = ((fgRed * fgAlpha * fgOpac) + (1 - fgAlpha * fgOpac) + bgAlpha *  bgImg.data[indexBg])/ blendedAlpha ; 
                // Green
                bgImg.data[indexBg + 1] = ((fgGreen * fgAlpha * fgOpac) + (1 - fgAlpha * fgOpac) + bgAlpha *  bgImg.data[indexBg + 1])/ blendedAlpha ; 
                // Blue
                bgImg.data[indexBg + 2] = ((fgBlue * fgAlpha * fgOpac) + (1 - fgAlpha * fgOpac) + bgAlpha *  bgImg.data[indexBg + 2])/ blendedAlpha ; 
            
            }

            currBgX ++;
            
        }

        currBgX = fgX;
        currBgY ++;

    }

}
