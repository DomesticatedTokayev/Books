import express from "express";
import bodyparser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

const bookCoverAPI = "https://covers.openlibrary.org/b/";

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "books",
    password: "!Allnewposts115!",
    port: 5432
});

db.connect();

const newBook = {
    title: "Witcher",
    summary: "A book about witchers",
    notes: "Null and void",
    id_type: "ISBN",
    id_number: "1506702457",
    date_read: "2020-09-13",
    rating: 6
};
//  Available Cover: 1506702457
//  Unavailable Cover: 1847941834
//setBookCovers(19, "ISBN", 1506702457);
//resetBookCovers();

// ------------------------- PostgreSQL Tests -------------------------
//await addNewBook(newBook);
//await updateBook(newBook);
//await deleteBookByID(2);
//await returnTopRatedBooks(3);
//await returnNewlyAddedBooks(3);
//await getBooks(10, 0);
//await getNumOfBooks();
// --------------------------------------------------------------------
// --------------------------------------------------------------------
// ----------------------- Book Cover API Tests -----------------------
//await getCover();
// --------------------------------------------------------------------
// --------------------------------------------------------------------

app.get("/", async (req, res) => {

    //Add New Book
    //var book = await addNewBook(newBook);
    var books = await returnNewlyAddedBooks(100, 0);

    //var date = new Date(books[0].date_read);


    // Refactor this: Just send the book.
    res.render("index.ejs", {data: books});
});

app.get("/select/:ID", async (req, res) => {
    const id = req.params.ID;

    const book = await getBook(id);

    res.render("book.ejs", { data: book });
});

//Change that to get (and get id from param)
app.post("/edit", async (req, res) => {
    const id = req.body.id;

    const book = await getBook(id);
    //console.log(book);
    //console.log("editing");
    res.render("new_edit.ejs", { data: book });
});


app.post("/edit_book", async (req, res) => {
    const updatedBook = {
        id: req.body.book_id,
        title: req.body.book_name,
        summary: req.body.summary,
        notes: req.body.notes,
        id_type: req.body.id_type,
        id_number: req.body.id_number,
        date_read: req.body.date_read,
        rating: req.body.rating
    };
    
    //console.log(newBook);
    
    await updateBook(updatedBook);
    await setBookCovers(updatedBook.id, updatedBook.id_type, updatedBook.id_number);
    //await resetBookCovers();

    res.redirect("/");
});

app.get("/new", (req, res) => {
    console.log("This one");
    res.render("new_edit.ejs");
});

app.post("/new", async (req, res) => {

    const newBook = {
    title: req.body.book_name,
    summary: req.body.summary,
    notes: req.body.notes,
    id_type: req.body.id_type,
    id_number: req.body.id_number,
    date_read: req.body.date_read,
    rating: req.body.rating
    };
    
    await addNewBook(newBook);
    //await setBookCovers(bookInfo.id, bookInfo.id_type, bookInfo.id_number);   
    resetBookCovers();
    
    res.redirect("/");
});


app.listen(port, error => {
    error ? console.log("Error in server start-up") : console.log("Listening on port ", port);
});

async function getBook(id)
{
    const result = await db.query(`
        SELECT books.id, title, summary, notes, id_type, id_number, date_read, rating, s_cover, m_cover
        FROM books
        JOIN book_covers
        ON books.id = book_covers.book_id
        WHERE books.id = $1`, [id]);
    return result.rows;
};


async function addNewBook(book) {
    try {
        const result = await db.query(`
        INSERT INTO books (title, summary, notes, id_type, id_number, date_read, rating)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, id_type, id_number`,
        [book.title, book.summary, book.notes, book.id_type, book.id_number, book.date_read, book.rating]);
    }
    catch (error)
    {
        console.log("AddNewBook Error: ", error.message);
    }
    //return result.rows[0];

    // Put this into post function (One function should do one thing)
    //await setBookCovers(result.rows[0].id, result.rows[0].id_type, result.rows[0].id_number);
}  

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Not working
async function updateBook(book)
{
    console.log(book);

    try {
        const result = await db.query(`UPDATE books SET title=$2, summary=$3, notes=$4, id_type=$5, id_number=$6, date_read=$7, rating=$8 WHERE id = $1`,
            [book.id, book.title, book.summary, book.notes, book.id_type, book.id_number, book.date_read, book.rating]);
    } catch (error)
    {
        console.log("AddNewBook Error: ", error.message);
    }
    
};

//This needs to be done first, then the book it self
async function deleteBookByID(id)
{
    const result = await db.query(`DELETE FROM books WHERE id = $1`, [id]);  
};

async function deleteBookCoversByID(id)
{
    const result = await db.query(`DELETE FROM book_covers WHERE id = $1`, [id]);  
}

//Needs altering (To include book_covers)
async function returnTopRatedBooks(numOfBooks, offset)
{
    const result = await db.query(`SELECT books.id, title, summary, notes, id_type, id_number, date_read, rating, s_cover, m_cover
        FROM books
        JOIN book_covers
        ON books.id = book_covers.book_id
        ORDER BY ratings DESC
        LIMIT $1 OFFSET $2`, [numOfBooks, offset]);
    
    return result.rows;

    // const result = await db.query(`SELECT * FROM books ORDER BY rating DESC LIMIT $1 OFFSET $2`, [numOfBooks, offset]);
    // return result.rows;
};

//Needs altering (To include book_covers)
async function returnNewlyAddedBooks(numOfBooks, offset)
{
    const result = await db.query(`SELECT books.id, title, summary, notes, id_type, id_number, date_read, rating, s_cover, m_cover
    FROM books
    JOIN book_covers
    ON books.id = book_covers.book_id
    ORDER BY date_read DESC
    LIMIT $1 OFFSET $2`, [numOfBooks, offset]);

    return result.rows;
    // const result = await db.query(`SELECT * FROM books ORDER BY date_read DESC LIMIT $1 OFFSET $2`, [numOfBooks, offset]);
    // return result.rows;
};

// To Do !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Also add s_cover and m_cover !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
async function getBooksByName(numOfBooks, offset = 0)
{
    const result = await db.query(`SELECT * FROM books ORDER BY TITLE ASC LIMIT $1 OFFSET $2`, [numOfBooks, offset]);
    console.log(result.rows);
    return result.rows;
};

async function getNumOfBooks()
{
    const result = await db.query("SELECT COUNT(*) FROM books");
    return result.rows[0].count;
};

// Called then new books are added
async function setBookCovers(book_id, id_type, id_number)
{
    const id = book_id;
    const idType = id_type;
    const idNumber = id_number;

    //Get covers
    const s_cover = await getCover(idType, idNumber, "S");
    const m_cover = await getCover(idType, idNumber, "M");


    // Check if book_covers already hold entry
    const result = await db.query(`SELECT COUNT(*) FROM book_covers WHERE book_id =$1`, [book_id]);

    try {
        if (result.rows[0].count > 0)
        {
            // Update existing covers
            await db.query("UPDATE book_covers SET s_cover=$1, m_cover = $2 WHERE book_id = $3 RETURNING s_cover, m_cover", [s_cover, m_cover, id]);
        }
        else
        {
            // Create new book covers
            await db.query(`INSERT INTO book_covers (book_id, s_cover, m_cover)
                                             VALUES ($1, $2, $3)`, [id, s_cover, m_cover]);   
        }
    }
    catch (error)
    {
        console.log("setCovers Error:", error.message);
    }
};

async function getCover(ID_Type, IBSN_number, size = "S")
{
    var coverLink = "";
    try
    {
        await axios.get(`https://covers.openlibrary.org/b/${ID_Type}/${IBSN_number}-${size}.jpg?default=false`); 
        coverLink = `${bookCoverAPI}${ID_Type}/${IBSN_number}-${size}.jpg?default=false`;
    }
    catch (error)
    {
        console.log(`Error, ${IBSN_number} cover couldn't be found: `, error.response.status);
    }

    if (coverLink == "")
    {
        return null;
    }
    
    return coverLink;
};

//  Reset all book covers
async function resetBookCovers()
{
    const result = await db.query(`SELECT id, id_type, id_number FROM books`);

    var bookCount = result.rows.length;

    for (var i = 0; i < bookCount; i++)
    {
        console.log(result.rows[i].id, " ", result.rows[i].id_type, " ", result.rows[i].id_number);
        setBookCovers(result.rows[i].id, result.rows[i].id_type, result.rows[i].id_number);
    }
};