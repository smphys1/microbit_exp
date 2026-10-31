export async function downloadPDF(element:HTMLElement,filename:string){
 const [{jsPDF},{default:html2canvas}]=await Promise.all([import('jspdf'),import('html2canvas')]);
 await document.fonts.ready;const pdf=new jsPDF({unit:'mm',format:'a4'});const margin=14,pageW=182,pageH=269;let y=margin;
 const blocks=Array.from(element.querySelectorAll<HTMLElement>('.pdf-block'));
 for(const block of blocks){const canvas=await html2canvas(block,{scale:1.6,backgroundColor:'#ffffff',logging:false,useCORS:true});if(!canvas.width||!canvas.height)continue;const ratio=pageW/canvas.width;let offset=0;
 while(offset<canvas.height){let room=margin+pageH-y;if(room<20){pdf.addPage();y=margin;room=pageH}const remain=canvas.height-offset;if(remain*ratio>room&&remain*ratio<=pageH){pdf.addPage();y=margin;room=pageH}
 let height=Math.min(remain,Math.floor(room/ratio));if(height<remain){const context=canvas.getContext('2d')!;const min=Math.floor(height*.88);for(let row=height-1;row>min;row--){const data=context.getImageData(0,offset+row,canvas.width,1).data;let ink=0;for(let x=0;x<data.length;x+=16)if(data[x]<235||data[x+1]<235||data[x+2]<235)ink++;if(ink===0){height=row;break}}}
 const slice=document.createElement('canvas');slice.width=canvas.width;slice.height=height;slice.getContext('2d')!.drawImage(canvas,0,offset,canvas.width,height,0,0,canvas.width,height);pdf.addImage(slice.toDataURL('image/jpeg',.95),'JPEG',margin,y,pageW,height*ratio);y+=height*ratio+2;offset+=height;if(offset<canvas.height){pdf.addPage();y=margin}}
 }
 pdf.save(filename);
}
