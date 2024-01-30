const yearText = document.getElementById("year");
const thisYear = new Date().getFullYear();

yearText.setAttribute("datetime", thisYear);
yearText.textContent = thisYear;

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
            if (openDropdown.classList.contains("show")) {
                openDropdown.classList.remove("show");
            }
        }
    }
}


const discardButton = document.getElementById("discard_new");

if (discardButton)
{
    discardButton.addEventListener("click", () => {
        history.back();
        console.log("Back");
    });
}