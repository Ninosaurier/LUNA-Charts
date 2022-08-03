
export function getXCoordinateForPercent(decimalPointPercent: number){
    
    //console.log("getXCoordinateForPercent: ", Math.cos(2 * Math.PI * percent));
    return  Math.cos(2 * Math.PI * decimalPointPercent);
}

function getYCoordinateForPercent(decimalPointPercent: number) {

    //console.log("getYCoordinateForPercent: ", Math.sin(2 * Math.PI * percent));
    return  Math.sin(2 * Math.PI * decimalPointPercent);
}

function calculateLargeArcFlag(decimalPointPercent: number){

    //console.log("calculateLargeArcFlag: ", percent > .5 ? 1 : 0);
    return decimalPointPercent > .5 ? 1 : 0;
}
