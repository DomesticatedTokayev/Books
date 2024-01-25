
//else if(page ==="edit") {%>  
//     <%if(locals.book) {%>
//         <form action="/edit_book" method="post">
//             <input type="hidden" name="id" value="<%=book[0].id%>" id="book_id">
//             <button class="header__button confirm" type="submit">Confirm</button>
//         </form>
//         <form action="/select" method="post">
//             <input type="hidden" name="book_id" value="<%=book[0].id%>" id="book_id">
//             <button class="header__button discard" type="submit">Discard</button>
//         </form>
//         <%}%> 
// <%}else if(page ==="new") {%>
//     <%if(locals.book) {%>
//         <form action="/new" method="post">
//             <input type="hidden" name="id" value="<%=book[0].id%>" id="book_id">
//             <button class="header__button confirm" type="submit">Confirm</button>
//         </form>
//         <form action="/" method="get">
//             <button class="header__button discard" type="submit">Discard</button>
//         </form>
//         <%}%> 
// <%}%>   