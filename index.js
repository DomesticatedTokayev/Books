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
    console.log(books);
    res.render("index.ejs", {data: books});
});

app.post("/new", async (req, res) => {

    const newBook = {
    title: "Witcher",
    summary: "A book about witchers",
    notes: "Null and void",
    id_type: "ISBN",
    id_number: "1506702457",
    date_read: "2020-09-13",
        rating: 6
    };
    
    var bookInfo = await addNewBook(newBook);
    await setBookCovers(bookInfo.id, bookInfo.id_type, bookInfo.id_number);

    
});

app.listen(port, error => {
    error ? console.log("Error in server start-up") : console.log("Listening on port ", port);
});

async function getBook(id)
{
    const result = await db.query(`
        SELECT books.id, title, notes, id_type, id_number, date_read, rating, s_cover, m_cover
        FROM books
        JOIN book_covers
        ON books.id = book_covers.book_id
        WHERE books.id = $1`, [id]);
    return result.rows;
};


async function addNewBook(book) {
    const result = await db.query(`
        INSERT INTO books (title, summary, notes, id_type, id_number, date_read, rating)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, id_type, id_number`,
        [book.title, book.summary, book.notes, book.id_type, book.id_number, book.date_read, book.rating]);

    //return result.rows[0];

    // Put this into post function (One function should do one thing)
    await setBookCovers(result.rows[0].id, result.rows[0].id_type, result.rows[0].id_number);
}  

async function updateBook(book)
{
    const result = await db.query(`UPDATE books SET title=$2, summary=$3, notes=$4, id_type=$5, id_number=$6, date_read=$7, rating=$8 WHERE id = $1`,
        [book.id, book.title, book.summary, book.notes, book.id_type, book.id_number, book.date_read, book.rating]);
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
    const result = await db.query(`SELECT books.id, title, notes, id_type, id_number, date_read, rating, s_cover, m_cover
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
    const result = await db.query(`SELECT books.id, title, notes, id_type, id_number, date_read, rating, s_cover, m_cover
    FROM books
    JOIN book_covers
    ON books.id = book_covers.book_id
    ORDER BY date_read DESC
    LIMIT $1 OFFSET $2`, [numOfBooks, offset]);

    return result.rows;
    // const result = await db.query(`SELECT * FROM books ORDER BY date_read DESC LIMIT $1 OFFSET $2`, [numOfBooks, offset]);
    // return result.rows;
};

// async function getBooks(numOfBooks, offset = 0)
// {
//     const result = await db.query(`SELECT * FROM books ORDER BY date_read DESC LIMIT $1 OFFSET $2`, [numOfBooks, offset]);
//     console.log(result.rows);
//     return result.rows;
// };

async function getNumOfBooks()
{
    const result = await db.query("SELECT COUNT(*) FROM books");
    console.log(result.rows[0].count);
    return result.rows[0].count;
};

async function setBookCovers(book_id, id_type, id_number)
{
    const id = book_id;
    const idType = id_type;
    const idNumber = id_number;


    //Get covers
    const s_cover = await getCover(idType, idNumber, "S");
    const m_cover = await getCover(idType, idNumber, "M");

    const result = await db.query(`INSERT INTO book_covers (book_id, s_cover, m_cover)
                                    VALUES ($1, $2, $3)`, [id, s_cover, m_cover]);
};

async function updateBookCover(book_id, id_type, id_number)
{
    const id = book_id;
    const idType = id_type;
    const idNumber = id_number;

    const s_cover = await getCover(idType, idNumber, "S");
    const m_cover = await getCover(idType, idNumber, "M");

    try {
        const result = await db.query("UPDATE book_covers SET s_cover=$1, m_cover = $2 WHERE book_id = $3 RETURNING s_cover, m_cover", [s_cover, m_cover, id]);
    }
    catch (error)
    {
        console.log(error.message);
    }
}

async function getCover(ID_Type, IBSN_number, size = "S")
{
    //https://covers.openlibrary.org/b/ISBN/1501197274-L.jpg
    //https://covers.openlibrary.org/b/
    try
    {
        const response = await axios.get(`${bookCoverAPI}${ID_Type}/${IBSN_number}-${size}.jpg?default=false`); 
        return `${bookCoverAPI}${ID_Type}/${IBSN_number}-${size}.jpg?default=false`;
    }
    catch (error)
    {
        console.log(`Error, ${IBSN_number} cover couldn't be found: `, error.response.status);
    }
    return null;
}