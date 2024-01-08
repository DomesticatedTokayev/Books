window.onload = function () {

     //setBookLinks();
     
     function setBookLinks() {
        
         var numOfBooks = document.getElementsByClassName("book").length;

         for (var i = 0; i < numOfBooks; i++)
         {
             setLink(i);
         }
    }
    
    function setLink(index)
    {
        document.getElementsByClassName("book")[index].addEventListener("click", function () {
              
            window.location = document.getElementsByClassName("book-link")[index].href;
       });
    }
     
};

