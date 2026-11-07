// One initial GPS centering only. Manual browsing always takes precedence.
export function createMapView(){
 let initial=true;
 return {locate(){if(!initial)return false;initial=false;return true;},manual(){initial=false;},current(){initial=false;}};
}
