// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {
    
    let isFirst = false;

    let fgWidth = fgImg.width;
    let fgHeight = fgImg.height;

    // Ref to position on bg image to blend
    let fgX = fgPos.x;
    let fgY = fgPos.y;

    let bgWidth = bgImg.width;
    let bgHeight = bgImg.height;

    if (isFirst == false){
        console.log("START");
        console.log("bgImg: ", bgImg);
        console.log("fgImg: ", fgImg);
        console.log("fgOpac: ", fgOpac);
        console.log("fgPos: ", fgPos);
        console.log("fgWidth: ", fgWidth);
        console.log("fgHeight: ", fgHeight);
        console.log("bgWidth: ", bgWidth);
        console.log("bgHeight: ", bgHeight);
    }

    if ((fgX< 0 && Math.abs(fgX) >= fgWidth) || (fgY<0 && Math.abs(fgY) >= fgHeight) || fgX >= bgWidth || fgY >= bgHeight) {
         console.log("fgPos is out of bounds");
        // console.log("fgX: ", fgX);
        // console.log("fgY: ", fgY);
        // console.log("fgWidth: ", fgWidth);
        // console.log("fgHeight: ", fgHeight);
        // console.log("bgWidth: ", bgWidth);
        // console.log("bgHeight: ", bgHeight); 
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
    if (isFirst == false){
        console.log("blendXpos: ", blendXpos);
        console.log("blendYpos: ", blendYpos);
        console.log("fgX: ", fgX);
        console.log("fgY: ", fgY);
    }

    let currFgX = 0;
    let currFgY = 0;

    let currBgX = fgX;
    let currBgY = fgY;

    console.log("Math.min(fgHeight - blendYpos, bgHeight - currBgY): ", Math.min(fgHeight - blendYpos, bgHeight - currBgY));
    console.log("Math.min(fgWidth - blendXpos, bgWidth - currBgX): ", Math.min(fgWidth - blendXpos, bgWidth - currBgX));
    console.log("fgHeight - blendYpos: ", fgHeight - blendYpos);
    console.log("bgHeight - currBgY: ", bgHeight - currBgY);
    console.log("fgWidth - blendXpos: ", fgWidth - blendXpos);
    console.log("bgWidth - currBgX: ", bgWidth - currBgX);
    console.log("fgHeight - currFgY: ", fgHeight - currFgY);
    console.log("fgWidth - currFgX: ", fgWidth - currFgX);
    for (currFgY = blendYpos;  currFgY < blendYpos + Math.min(fgHeight - blendYpos, bgHeight - fgY); currFgY++) {

        for (currFgX = blendXpos;  currFgX < blendXpos + Math.min(fgWidth - blendXpos, bgWidth - fgX) ; currFgX++) {

            fgRed = fgImg.data[currFgY * fgWidth * 4 + currFgX * 4];
            fgGreen = fgImg.data[currFgY * fgWidth * 4 + currFgX * 4 + 1];
            fgBlue = fgImg.data[currFgY * fgWidth * 4 + currFgX * 4 + 2];
            fgAlpha = fgImg.data[currFgY * fgWidth * 4 + currFgX * 4+ 3]/255;
        
        
            
                // Blend with background
                if ((currBgY * bgWidth * 4 + currBgX * 4 + 3 )< bgImg.data.length) {
                    
                    let indexBg = currBgY * bgWidth * 4 + currBgX * 4 ; 
                    
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
                    //bgImg.data[indexBg + 2] = (fgOpac * fgAlpha + bgAlpha * bgImg.data[indexBg + 2] * (1 - fgAlpha * fgOpac) + (fgBlue * fgAlpha * fgOpac)) / blendedAlpha;
                
                }
                currBgX ++;
            }
        
        

       
            //  console.log("START BLEND"); 
              // Blend with background
              if ((currBgY * bgWidth * 4 + currBgX * 4 + 3) < bgImg.data.length) {
              
                currBgX = fgX;
                } 
                currBgY ++;
        
       
    }

    console.log("current fgX: ", fgX);
    console.log("current fgY: ", fgY);

    console.log("current currFgX: ", currFgX);
    console.log("current currFgY: ", currFgY);

    console.log("current currBgX: ", currBgX);
    console.log("current currBgY: ", currBgY);

    console.log("fgPos: ", fgPos); 
    console.log("END");
}
