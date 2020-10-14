# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

!["Screenshot of URLs page"](https://github.com/victoriamlee/tinyapp/blob/master/docs/urls-page.png?raw=true)
!["Screenshot of Register page"](https://github.com/victoriamlee/tinyapp/blob/master/docs/register-page.png?raw=true)
!["Screenshot of Login page"](https://github.com/victoriamlee/tinyapp/blob/master/docs/login-page.png?raw=true)
!["Screenshot of Create new URL page"](https://github.com/victoriamlee/tinyapp/blob/master/docs/new-page.png?raw=true)
!["Screenshot of Short URL page"](https://github.com/victoriamlee/tinyapp/blob/master/docs/id-page.png?raw=true)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.

## Steps

- Users must register or login to create, edit, or view the short links.
- Users can create a new short link by clicking Create New URL on navigation bar or Create a New Short Link button in My URLs page.
- In the My URLs page, users can edit or delete the short links they created.
- When users click the short url, they will be redirected to the webpage.