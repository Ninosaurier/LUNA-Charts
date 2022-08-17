export function findParentHeaderOfElement(startNode: HTMLElement): number {
  let parent: HTMLElement = startNode.parentElement as HTMLElement;
  let resultHeader = 0;

  while (parent.tagName !== 'HTML' && resultHeader === 0) {
    const nodes = Array.from(parent.children);

    for (let index = nodes.length - 1; index >= 0; index -= 1) {
      if (nodes[index].tagName.toLowerCase().match('h1|h2|h3|h4|h5|h6') && resultHeader === -1) {
        resultHeader = parseInt(nodes[index].tagName[1], 10);
      }
    }

    parent = parent.parentElement as HTMLElement;
  }

  return resultHeader;
}

export function createHeaderTagForElement(parendNode: HTMLElement, title: string) {
  const headerNumber = findParentHeaderOfElement(parendNode);
  let newHeader: HTMLElement;

  if (headerNumber > 5) {
    // eslint-disable-next-line no-console
    console.warn(`Headline cannot be created. HTML allows only h1 - h6. The chart would get h${headerNumber + 1}`);
  } else {
    // console.log('Headernumber: ', headerNumber);

    if (headerNumber === 0) {
      // eslint-disable-next-line no-console
      console.warn('Creating a h1 header! Is this intended?');
      newHeader = document.createElement(`h${headerNumber + 1}`);
    } else {
      newHeader = document.createElement(`h${headerNumber + 1}`);
    }

    newHeader.setAttribute('tabindex', '0');
    newHeader.setAttribute('aria-label', title);
    newHeader.innerHTML = title;
    parendNode.appendChild(newHeader);
  }
}
