portNum = 8078;


var control = {
  clicked: 0,
  isFavorite: 1,
  showFavorite: 0
  // withLabel: 0
};


var imageArray = new Array();

//when click the upload button
function uploadImage() {
  var selectedFile = document.getElementById('fileSelector').files[0];


  var imageId = imageArray.length;
  imageArray.push({
    id: imageId,
    showFullMenuClicked: 0,
    isFilter: 0,
    labels: "",
    imageName: selectedFile.name,
    favorite: 0
  });

  readFileAndFading(selectedFile, imageId);
}

function uploadImageToServer(selectedFile, imageId) {
  var url = "http://138.68.25.50:" + portNum;

  var formData = new FormData();

  // upload file to server
  formData.append("userfile", selectedFile);

  var oReq = new XMLHttpRequest();
  let pictureBlock = document.getElementsByClassName("indiPicture");

  oReq.onload = function() {
    //googleCV
//     var result  = oReq.responseText;
//     var labelArr = result.split(";");
//     insertLabelsToHtml(imageId,labelArr);
//     unFade(imageId);

    if(oReq.status == 500) {
      pictureBlock[0].remove();
      alert("Upload Error");
    }
    else {
      unFade(imageId);
      getLabelsFromApi(selectedFile.name, imageId);
    }
  }

  // var progress = document.createElement("p");
  // progress.id = "progress";
  var progress = document.createElement("div");
  progress.id = "progress";
  var bar = document.createElement("div");
  bar.id = "bar";
  progress.appendChild(bar);
  document.getElementById("labels" + imageId).appendChild(progress);
  bar = document.getElementById("bar");

  oReq.upload.addEventListener("progress", function(e){
    var pc = parseInt((e.loaded / e.total * 100));
    document.getElementById("bar").style.width = pc + '%'; 
  }, false);

  oReq.onreadystatechange = function(e) {
    if (oReq.readyState == 4) {
      document.getElementById("progress").remove();
    }
  };

  oReq.open("POST", url);
  oReq.send(formData);
}

function unFade(imageID) {
  var img = document.getElementById('imageFile' + imageID);
  img.style.opacity = 1;

}

// read from local
function readFileAndFading(selectedFile, imageId) {

  var fr = new FileReader();

  fr.onload = function() {
    setPictureBlock(fr.result, imageId, selectedFile);
  };
  fr.readAsDataURL(selectedFile);


}

// get html file from server and set it
function setPictureBlock(imageFile, imageId, selectedFile) {
  var oReq = new XMLHttpRequest();
  var url = "indipicture.html";
  oReq.open("GET", url);
  oReq.onload = function() {

    var pictures = document.getElementsByClassName("pictures")[0];
    var indipicture = document.createElement('div');
    indipicture.setAttribute('class', 'indiPicture');
    if (pictures.firstChild){
      pictures.insertBefore(indipicture,pictures.firstChild);
    }else{
      pictures.appendChild(indipicture);
    }

    indipicture.innerHTML = oReq.responseText;


    changeTemplate(imageFile, imageId);

    //where upload new image by the user
    if (selectedFile !== undefined) {
      uploadImageToServer(selectedFile, imageId);
      //request google api labels here? not sure.
      // getLabelsFromApi(selectedFile);
    }
    //where pulling image's labels from the server database.
    else {
      var labels = imageArray[imageId].labels;
      var labelArr = labels.split(";");
      insertLabelsToHtml(imageId,labelArr);
      unFade(imageId);
    }

  }
  oReq.send();

}

function insertLabelsToHtml(imageId,labelArr){
  for (var i = 0; i < labelArr.length; i++) {
    if (labelArr[i] != "" && labelArr[i] != " ") {
      addLabels(imageId.toString(), labelArr[i]);
    }
  }
}

//this is to give every image a new id for needed
//onclick function.
function changeTemplate(imageFile, imageId) {

  // change the image
  var img = document.getElementById('imageFile');
  img.setAttribute('id', 'imageFile' + imageId);
  img.setAttribute('src', imageFile);
  img.setAttribute('alt', "no image");
  img.style.opacity = 0.5;


  var ids = ['fullMenu', 'changeTagBtn', 'changeFavBtn', 'showFullMenuBtn',
    'labels', 'showForChange', 'labelInput', 'addBtn'
  ];

  for (var i = 0; i < ids.length; i++) {
    var element = document.getElementById(ids[i]);
    element.setAttribute('id', ids[i] + imageId);

    if (ids[i] == 'changeTagBtn') {
      element.onclick = function() {return changeTag(imageId);}
    }
    if (ids[i] == 'changeFavBtn' && imageArray[imageId].favorite === 1) {
      element.value = "unfavorite";
    }
  }

}


function createPictureBlock(fileName, id, labels, favorite) {
  //get the image path of server
  var src = "/assets/" + fileName;
  setPictureBlock(src, id);
}

var uploadClick = 0;

function showUpload() {
  var x = document.getElementById('showForUpload');

  if (uploadClick === 0) {
    x.style.display = 'block';
    uploadClick = 1;
  } else {
    x.style.display = 'none';
    uploadClick = 0;
  }
}

function showUpload2() {
  var x = document.getElementById('MobileUpload');

  if (uploadClick === 0) {
    x.style.display = 'block';
    uploadClick = 1;
  } else {
    x.style.display = 'none';
    uploadClick = 0;
  }
}

function showFullMenu(id) {
  //console.log("test if onclick works.");

  var num = id.replace("showFullMenuBtn","");
  var fullMenuId = id.replace("showFullMenuBtn", "fullMenu");

  var showFullMenuBtn = document.getElementById(fullMenuId);

  if (imageArray[num].showFullMenuClicked === 0) {
    showFullMenuBtn.style.display = 'block';
    imageArray[num].showFullMenuClicked = 1;
  } else {
    showFullMenuBtn.style.display = 'none';
    imageArray[num].showFullMenuClicked = 0;
  }

}

//make every label has a delete image
function addLabels(id, text) {
  var num = id.replace("addBtn", "");

  var labelInput = document.getElementById('labelInput' + num);
  //this is for the p tag
  var labels = document.getElementById('labels' + num);
  var addDiv = makeDiv(labels);
  var addImg = makeImg(addDiv);
  var addSpan = makeSpan(addDiv);
  var labelToEdit = "";

  //in here, user add a labels, please update databasehere as well
  //may need to check if the x[i].value is empty!

  if (text === undefined) {
    addDiv.getElementsByClassName('removeButton')[0].style.display = 'inline';
    text = labelInput.value;
    updateLabelsToDB(num, text);
  }

  addSpan.innerHTML += " " + text;

  changeTag(num);
  changeTag(num);
  //delete labels
  //please update database here as well
  addImg.onclick = function() {
    addDiv.remove();
    changeTag(num);
    changeTag(num);
    removeLabelsFromDB(num, text);
  };

}

function updateLabelsToDB(num, label) {
  var imageName = imageArray[num].imageName;
  var query = "/query?op=add&img=" + imageName + "&label=" + label;

  var oReq = new XMLHttpRequest();
  oReq.open("GET", query);

  oReq.onload = function() {
    if (oReq.status == 500) {
      let imageBlock = document.getElementById('labels'+num);
      let tagBlocks = imageBlock.getElementsByClassName('deleteLabel');
      let index = tagBlocks.length - 1;
      tagBlocks[index].remove();
      alert("Label Existed");
    }
    else {
      imageArray[num].labels += ";" + label;
    }
    console.log(oReq.status);
  }

  oReq.send();
}

function removeLabelsFromDB(num, label) {
  console.log(label);
  var imageName = imageArray[num].imageName;
  var query = "/query?op=remove&img=" + imageName + "&label=" + label;

  var oReq = new XMLHttpRequest();
  oReq.open("GET", query);

  oReq.onload = function() {
    imageArray[num].labels = imageArray[num].labels.replace(";" + label, "");
    console.log(imageArray[num].labels);
    console.log(oReq.responseText);
  }

  oReq.send();
}

function makeDiv(y) {
  //create div tag
  var addDiv = document.createElement("div");
  addDiv.className = "deleteLabel";
  y.appendChild(addDiv);
  return addDiv;
}

function makeImg(addDiv) {
  var ImgURL = "photobooth/removeTagButton.png";
  var addImg = document.createElement("img");
  addImg.src = ImgURL;
  addImg.className = "removeButton";

  addDiv.appendChild(addImg);
  return addImg;
}

function makeSpan(addDiv) {
  var addSpan = document.createElement("span");
  addDiv.appendChild(addSpan);
  return addSpan;
}

function changeTag(id) {
  //get the p tag
  var labelBlock = document.getElementById('labels' + id);
  //the div that contains input and button.
  var showingBlock = document.getElementById('showForChange' + id);

  //images with lables
  var removeButtons = labelBlock.getElementsByClassName('removeButton');

  if (!removeButtons[0] || removeButtons[0].style.display != 'inline') {
    labelBlock.style.backgroundColor = '#CAB9B2';


    if (removeButtons.length < 10) {
      labelBlock.style.borderBottom = '0px solid black';
      showingBlock.style.display = 'block';
    }


    for (var i = 0; i < removeButtons.length; i++) {
      removeButtons[i].style.display = 'inline';
    }
  }
  else {
    labelBlock.style.backgroundColor = 'white';
    labelBlock.style.borderBottom = '1px solid black';
    showingBlock.style.display = 'none';

    var removeButtons = labelBlock.getElementsByClassName('removeButton');

    for (var i = 0; i < removeButtons.length; i++) {
      removeButtons[i].style.display = 'none';
    }
  }
}

var filterClick = 0;

//for the nav filter
function showFilter(){
  var filterMenu = document.getElementById('showForFilter');
  var filterWord = document.getElementById('FilterWord');
  var filter = document.getElementById('filter');

  if (filterMenu.style.display == 'block') {
    filterMenu.style.display = 'none';
    filterWord.style.display = 'none';
    filter.style.display = 'block';
  }
  else {
    filterMenu.style.display = 'block';
    filterWord.style.display = 'block';
    filter.style.display = 'none';
// googleCV
//    clicked = 1;
    filterClick = 1;
  }
}

function showFilter2(){
  var filterMenu = document.getElementById('showForFilter');
  var filterWord = document.getElementById('FilterWord');
  var filter = document.getElementById('filter');
}


function showFilter3(){
  var mobilefilter = document.getElementById('MobileFilter');

  if (mobilefilter.style.display == 'block') {
    mobilefilter.style.display = 'none';
  } else {
    mobilefilter.style.display = 'block';
  }
}

//fetch pictures from server when open main page.
//called when load the main webpage
function fetchPictures() {
  var url = "/fetchPictures";
  var oReq = new XMLHttpRequest();
  oReq.open("GET", url);

  oReq.onload = function() {

    console.log(oReq.responseText);

    var jsonArr = JSON.parse(oReq.responseText);

    //putting every picture's info into imageArray.
    for (var i = 0; i < jsonArr.length; i++) {
      imageArray.push({
        id: i,
        showFullMenuClicked: 0,
        labels: jsonArr[i].labels,
        imageName: jsonArr[i].fileName,
        favorite: jsonArr[i].favorite
      });

      //putting image into the html page.
      createPictureBlock(jsonArr[i].fileName, i, jsonArr[i].labels, jsonArr[i].favorite);

    }


  }
  oReq.send();
}

//show the upload file name
function chooseFile(e) {
  document.getElementById('fileName').innerHTML = e.files[0].name;
  document.getElementById('fileName2').innerHTML = e.files[0].name;
}


//update database of favorite
function addToFavorites(id){
  var num = id.replace("changeFavBtn", "");
  //know which image to update
  var imageName = imageArray[num].imageName;
  var passVal = 0;

  //find the button, so that we can change the value of it
  var changeValue = document.getElementById(id);
  //changing the button text.
  console.log(changeValue);
  console.log(changeValue.value);
  if(control.isFavorite === 1){
    control.isFavorite = 0;
  }else{
    control.isFavorite = 1;
  }

  if(imageArray[num].favorite === 0){
    changeValue.value = "unfavorite";
      passVal = 1;
      imageArray[num].favorite = 1;
  } else {
    changeValue.value = "add to favorites";
      imageArray[num].favorite = 0;
  }

  var query = "/query?op=fav&img=" + imageName + "&favorite=" + passVal;

  var oReq = new XMLHttpRequest();
  oReq.open("GET", query);

  oReq.onload = function() {
    console.log(oReq.responseText);

  }
  oReq.send();
}

//only show picture with favorite is 1;
//when click again go back to show all images.
function favoriteFilter(){
  var buttonVal = document.getElementsByClassName('firstLevel');
  var allImgs = document.getElementsByClassName('indiPicture');
  var imageNum = imageArray.length;
  if(control.showFavorite === 0){
    for(i = 0; i < imageNum; i++){
      if(imageArray[i].favorite === 0){
        //block this images
        allImgs[imageNum -1 - imageArray[i].id].style.display = "none";
      }
    }
    control.showFavorite = 1;
    buttonVal[1].textContent = "All";
  }else{//not sure if this is neeeded
    for(i = 0; i < imageNum; i++){
      if(imageArray[i].favorite === 0){
        //block this images
        allImgs[imageNum -1 - imageArray[i].id].style.display = "block";
      }
    }
    control.showFavorite = 0;
    buttonVal[1].textContent = "favorite";
  }

}

function labelFilter(inputLabel){
  console.log("enter labelFilter method");
  if(inputLabel === undefined){
    var getLabel = document.getElementById("Secondfilter").value;
  }else{
    var getLabel = inputLabel;
  }
  console.log(getLabel);
  var allImgs = document.getElementsByClassName('indiPicture');
  var imageNum = imageArray.length;
  // if(control.withLabel === 0){
    for(i = 0; i < imageNum; i++){
      var labels = imageArray[i].labels;
      var labelArr = labels.split(";");
      console.log(labelArr);

      for (var j = 0; j < labelArr.length && labelArr.length !== 0; j++) {
        if(labelArr[j] == getLabel){
          j = labelArr.length;
          imageArray[i].isFilter = 1;
        }else{
          if(j === labelArr.length - 1){
          allImgs[imageNum -1 - imageArray[i].id].style.display = "none";
          imageArray[i].isFilter = 0;
          }
        }
      }
    }
    // control.withLabel = 1;
  // }
}

function mobileLabelFilter(){
  var getLabel = document.getElementById("Thirdfilter").value;
  labelFilter(getLabel);

}

//need to show all the images back.
function clearFilter() {
// function clearFilter(clearTest) {
  // if(clearTest !== undefined){
  //   document.getElementById(clearTest).value=''
  // }else{
  //   document.getElementById('Secondfilter').value='';
  // }
  var clearText = document.getElementById('Secondfilter').value='';
  var allImgs = document.getElementsByClassName('indiPicture');
  var imageNum = imageArray.length;
    for(i = 0; i < imageNum; i++){
      console.log(imageArray[i].isFilter);
      console.log(imageArray[i].id);
      if(imageArray[i].isFilter === 0){
        //show this images
        allImgs[imageNum -1 - imageArray[i].id].style.display = "block";
      }
    }

    if (control.showFavorite == 1) {
      favoriteFilter();
    }
}

function clearFilter2() {
  var clearText = document.getElementById('Thirdfilter').value='';
  // clearFilter(clearText);
  clearFilter();
}


//not sure this.
function getLabelsFromApi(imageName, id){
  // var query = "/query?op=fav&img=" + imageName + "&favorite=" + passVal;
  var url = "/query?op=get&img=" + imageName;

  console.log(imageName);
  var oReq = new XMLHttpRequest();
  oReq.open("GET", url);
  oReq.onload = function() {
    var jsonObj = JSON.parse(oReq.responseText);
    var labelArr = jsonObj.labels.split(";");
    imageArray[id].labels = labelArr;
    insertLabelsToHtml(id,labelArr);
    return;
  }
  oReq.send();
}
