function SelectBook(id)
{
    document.getElementById(id).submit();
}

function dropdown()
{
    document.getElementById("header__dropdown").classList.toggle("show");
}


function cancelDropdown() {
    document.getElementById("header__dropdown").classList.toggle("show");
}

//Close dropdown meny if user clicks off it
window.onclick = function (event) {
    if (!event.target.matches(".dropdown_button"))
    {
        var dropdowns = document.getElementsByClassName("dropdown__content");
        for (let i = 0; i < dropdowns.length; i++)
        {
            let openDropdown = dropdowns[i];
            console.log(openDropdown);
            if (openDropdown.classList.contains("show")) {
                openDropdown.classList.remove("show");
            }
        }
    }
}