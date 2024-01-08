export class user // export class user -> to export individual classes. Requires import ->{class name}<- from "file"
{
    constructor(name, age)
    {
        this.name = name;
        this.age = age;
    }

    name;
    age;

    print()
    {
        console.log(`Hello ${this.name}, you're ${this.age} old!`);
    };
}



//export default user; // -> Only one export per file. Can import with custom name: import "custom name" from "file" <-should be avoided
export default class Employee
{
    constructor(name, age, salary)
    {
        this.name = name;
        this.age = age;
        this.salary = salary;
    }

    name;
    age;
    salary;
}



//Notes
// Only one default per file
// As many named export as necessary

// Exporting function
export function sum(a, b)
{
    return a + b;
}

//Exporting variable Notes
// Variable must first be declared and then exported on the next line when using default export

// Named export
export var multiply = (a, b) => {
    return a * b;
};

// Exporting as default (disabled)
var another = "hello";

// export default another;


// You can also export everything at the end
//export {user, sum, multiply, Employee };