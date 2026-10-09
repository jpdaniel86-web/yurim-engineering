// A nested entry belongs to the preceding primary entry in the supplied menu.
export function navigationTree(group) {
 const branches=[];
 for(const [label,path,nested] of group.items){
  const item={label,path,children:[]};
  if(nested&&branches.length)branches.at(-1).children.push(item);
  else branches.push(item);
 }
 return branches;
}

export const branchContains=(branch,path)=>branch.path===path||branch.children.some(child=>child.path===path);
