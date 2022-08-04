export function findParentHeaderOfElement(startNode: HTMLElement): number{

    let parent: HTMLElement = startNode.parentElement as HTMLElement;
    let resultHeader: number  = -1;
    
    while(parent.tagName !== 'HTML' && resultHeader === -1){

      Array.from(parent.children).reverse().forEach(element => {

        if(element.tagName.toLowerCase().match('h1|h2|h3|h4|h5|h6') && resultHeader === -1){

          resultHeader =  parseInt(element.tagName[1]);
        }

      });
      
      parent = parent.parentElement as HTMLElement;
    }

    return resultHeader;
}

export function createHeaderTagForElement(parendNode: HTMLElement, title: string){

    let headerNumber = findParentHeaderOfElement(parendNode);
    let newHeader: HTMLElement;

      if(headerNumber > 5){
        console.warn('Headline cannot be created. HTML allows only h1 - h6. The chart would get h'+ (++headerNumber));
      }else{

        //console.log('Headernumber: ', headerNumber);

        if(headerNumber === null){
          console.warn('Creating a h1 header! Is this intended?');
          newHeader = document.createElement('h'+ (headerNumber +1));
        }
        else{
          newHeader = document.createElement('h'+ (headerNumber +1));
        }

        newHeader.setAttribute('tabindex', '0');
        newHeader.setAttribute('aria-label', title);
        newHeader.innerHTML = title;
        parendNode.appendChild(newHeader);
    }
}