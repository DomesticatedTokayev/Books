import 'dotenv/config'
import pg from "pg";
import axios from "axios";

// -------------------- Tests ---------------//
//  Available Cover: 1506702457
//  Unavailable Cover: 1847941834

const db = new pg.Client({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password:  process.env.PASSWORD,
    port:  process.env.PORT
});

export function connect()
{
    db.connect();
}

export function disconnect()
{
    db.disconnect();
}

export async function getBook(id)
{
    const result = await db.query(`
        SELECT *
        FROM books
        WHERE books.id = $1`, [id]);
    return result.rows[0];
};


export async function addNewBook(book) {

    let hasCover = await checkIfHasCover(book.id_type, book.id_number, "M");

    try {
        const result = await db.query(`
        INSERT INTO books (title, summary, notes, id_type, id_number, date_read, rating, has_cover)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
            [book.title, book.summary, book.notes, book.id_type, book.id_number, book.date_read, book.rating, hasCover]);
        
        return result.rows[0];
    }
    catch (error)
    {
        console.log("AddNewBook Error: ", error.message);
    }
}  

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Return a book to reload book page
export async function updateBook(book)
{
    let hasCover = await checkIfHasCover(book.id_type, book.id_number, "M");

    try {
        const result = await db.query(`
        UPDATE books
         SET title=$2, summary=$3, notes=$4, id_type=$5, id_number=$6, date_read=$7, rating=$8, has_cover=$9
          WHERE id = $1
          RETURNING *`,
            [book.id, book.title, book.summary, book.notes, book.id_type, book.id_number, book.date_read, book.rating, hasCover]);
        
        return result.rows[0];

    } catch (error)
    {
        console.log("Update Book Error: ", error.message);
    }
    
};

export async function deleteBookByID(id)
{
    try {
        const result = await db.query(`DELETE FROM books WHERE id = $1`, [id]);
    }
    catch (error)
    {
        console.log("deleteBookByID Error: ", error.message);
    }
};

export async function deleteBookCoversByID(id)
{
    try {
        const result = await db.query(`DELETE FROM book_covers WHERE book_id = $1`, [id]);  
    }
    catch (error)
    {
        console.log("deleteBookCoversByID Error: ", error.message);
    }
}

export async function returnTopRatedBooks(numOfBooks, offset = 0, asc = true)
{
    let direction = asc ? "ASC" : "DESC";

    const result = await db.query(`SELECT *
        FROM books
        ORDER BY rating ${direction}
        LIMIT $1 OFFSET $2`,[numOfBooks, offset]);
    
    return result.rows;
};

export async function returnNewlyAddedBooks(numOfBooks, offset = 0, asc = true)
{
    let direction = asc ? "ASC" : "DESC";
    const result = await db.query(`SELECT *
    FROM books
    ORDER BY date_read ${direction}
    LIMIT $1 OFFSET $2`, [numOfBooks, offset]);

    return result.rows;
};

export async function returnBooksByName(numOfBooks, offset = 0, asc = true)
{
    let direction = asc ? "ASC" : "DESC";

    const result = await db.query(`SELECT *
    FROM books
    ORDER BY TITLE ${direction}
    LIMIT $1 OFFSET $2`, [numOfBooks, offset]);

    return result.rows;
};

export async function getNumOfBooks()
{
    const result = await db.query("SELECT COUNT(*) FROM books");
    return result.rows[0].count;
};

export async function filterBooks(filterType, asc = true)
{
    let books = null;
    switch (filterType)
    {
        case "date":
        {
            books = await returnNewlyAddedBooks(100, 0, false);
            return books;
        }
        case "name":
        {
            books = await returnBooksByName(100, 0, asc);    
            return books;
        }
        case "rating":
        {
            books = await returnTopRatedBooks(100, 0, false);  // Temp
            return books;
        }
        default:
        {
            books = await returnNewlyAddedBooks(100, 0, false);
            return books;
        }
    }
}

// Called then new books are added
async function setBookCover(book_id, id_type, id_number)
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
    if (IBSN_number === null)
    {
        return null;
    }

    var coverLink = "";
    try
    {
        await axios.get(`https://covers.openlibrary.org/b/${ID_Type}/${IBSN_number}-${size}.jpg?default=false`); 
        coverLink = `${bookCoverAPI}${ID_Type}/${IBSN_number}-${size}.jpg?default=false`;

    }
    catch (error)
    {
        console.log(`Error, ${IBSN_number} cover couldn't be found: `, error.message);
    }

    if (coverLink == "")
    {
        return null;
    }
    
    return coverLink;
};

async function checkIfHasCover(ID_Type, IBSN_number, size = "S")
{
    let hasCover = false;
    try {
        await axios.get(`https://covers.openlibrary.org/b/${ID_Type}/${IBSN_number}-${size}.jpg?default=false`);
        hasCover = true;
    }
    catch (error)
    {
        console.log(`Error, ${IBSN_number} cover couldn't be found: `, error.message);
    }
    return hasCover;
}

// export async function updateBookCovers()
// {
//     try
//     {
//         let books = (await db.query("SELECT * FROM books")).rows;

//         for (let i = 0; i < books.length; i++)
//         {
//             try
//             {
//                 let hasCover = await checkIfHasCover(books[i].id_type, books[i].id_number, "M");

//                 try {
//                     await db.query("UPDATE books SET has_cover=$1 WHERE id = $2", [hasCover, books[i].id]);
//                 }
//                 catch (error)
//                 {
//                     console.log(error.message);
//                 }
//             }
//             catch (error)
//             {
//                 console.log(error.message);
//             }
            
//         }
//     }
//     catch (error)
//     {
//         console.log(error.message);
//     }
// }

// async function resetBookCovers()
// {
//     await db.query(`SELECT id, id_type, id_number FROM books`, async function (error, result)
//     {
//         if (error)
//         {
//             console.log("Error, Failed to reset covers", error);
//             return;    
//         }

//         var bookCount = result.rows.length;

//         for (var i = 0; i < bookCount; i++)
//         {
//             //console.log(result.rows[i].id, " ", result.rows[i].id_type, " ", result.rows[i].id_number);
//             await setBookCover(result.rows[i].id, result.rows[i].id_type, result.rows[i].id_number);
//         }
//     });

// };

