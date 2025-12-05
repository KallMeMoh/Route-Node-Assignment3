/**
 * add a slash (/) at the start of
 * a section to uncomment it's solution:
 *  (/* X.Y.) --> (//*)
 */

const path = require('node:path');
const fs = require('node:fs');

/* 1.1.
const filePath = path.resolve('./bonus.js');
const readStream = fs.createReadStream(filePath, {
  encoding: 'utf-8',
  highWaterMark: 20,
});
readStream.on('data', (chunk) => {
  console.log(chunk);
});
readStream.on('error', (e) => console.log(e));
// */

/* 1.2.
const srcPath = path.resolve('./bonus.js');
const destPath = path.resolve('./bonus.txt');
const readStream = fs.createReadStream(srcPath, {
  encoding: 'utf-8',
  highWaterMark: 20,
});
const writeStream = fs.createWriteStream(destPath);

readStream.on('data', (chunk) => {
  writeStream.write(chunk);
});
readStream.on('end', () => writeStream.end());

readStream.on('error', (e) => console.log(e));
writeStream.on('error', (e) => console.log(e));
// */

/* 1.3.
const srcPath = path.resolve('./bonus.js');
const destPath = path.resolve('./bonus.txt.gz');

const { createGzip } = require('node:zlib');
const zip = createGzip();

const readStream = fs.createReadStream(srcPath, {
  encoding: 'utf-8',
  highWaterMark: 20,
});
const writeStream = fs.createWriteStream(destPath);

readStream.pipe(zip).pipe(writeStream);
// */

//* 2.
let id = 1;
const dbFilePath = path.resolve('./users.json');

const { createServer } = require('node:http');
const server = createServer((req, res) => {
  const { method, url } = req;
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    try {
      console.log(method, url);
      const dbRawData = fs.readFileSync(dbFilePath);
      const dbUsers = JSON.parse(dbRawData);
      if (method === 'GET') {
        if (url === '/users') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(dbRawData);
        } else if (url.startsWith('/users/')) {
          const splitUrl = url.split('/');
          const id = Number(splitUrl[splitUrl.length - 1]);

          const user = dbUsers.find((usr) => usr.id === id);
          if (user) {
            res.writeHead(200, { 'content-type': 'application/json' });
            return res.end(JSON.stringify(user));
          }
          res.writeHead(404, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ message: 'User not found' }));
        }
      } else if (method === 'POST') {
        if (url === '/users') {
          const newUser = JSON.parse(body);

          const user = dbUsers.find((usr) => usr.email === newUser.email);
          if (user) {
            res.writeHead(409, { 'content-type': 'application/json' });
            return res.end(
              JSON.stringify({ message: 'Email already exists.' })
            );
          }

          dbUsers.push({ id: id++, ...newUser });

          fs.writeFileSync(dbFilePath, JSON.stringify(dbUsers));

          res.writeHead(201, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ message: 'USer added successfully.' }));
        }
      } else if (method === 'PATCH') {
        if (url.startsWith('/users/')) {
          const splitUrl = url.split('/');
          const id = Number(splitUrl[splitUrl.length - 1]);

          let flag = false;
          dbUsers.forEach((user, i) => {
            if (user.id === id) {
              dbUsers[i] = { ...dbUsers[i], ...JSON.parse(body) };
              flag = true;
            }
          });

          if (flag) {
            fs.writeFileSync(dbFilePath, JSON.stringify(dbUsers));
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(
              JSON.stringify({
                message: `USer ${Object.keys(JSON.parse(body)).join(
                  ','
                )} updated successfully.`,
              })
            );
          } else {
            res.writeHead(404, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ message: 'User ID not found.' }));
          }
        }
      } else if (method === 'DELETE') {
        if (url.startsWith('/users/')) {
          const splitUrl = url.split('/');
          const id = Number(splitUrl[splitUrl.length - 1]);

          let flag = false;
          dbUsers.forEach((user, i) => {
            if (user.id === id) {
              dbUsers.splice(i, 1);
              flag = true;
            }
          });

          if (flag) {
            fs.writeFileSync(dbFilePath, JSON.stringify(dbUsers));
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ message: 'User deleted successfully.' }));
          } else {
            res.writeHead(404, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ message: 'User ID not found.' }));
          }
        }
      }
    } catch (error) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: 'internal server error' }));
    }
  });

  req.on('error', (err) =>
    fs.writeFile(path.resolve('./logs.txt'), err.message)
  );
});

server.listen(4000, () => console.log('Server running on port 4000'));
// */

/** 3.
 * 1. The event loop is like a schedular, it's the part of node responsible for
 *    handling many operations at once even tho javascript is single-threaded.
 *    the event loop continously check if there's work to done in different queue
 *    and the call stack and starts excusting them passed on their priority.
 *    it's not the one that excutes code, it's the one that orders which gets excuted.
 *
 * 2. Libuv is a C library that provides Nodejs with asynchronous input output
 *    functionality, Javascript on the browser didn't have the ability to interact
 *    with the operating system directly, it couldn't read files on it's own.
 *    Libuv was made to fix that, it got JS out of the browser and allowed it to talk
 *    to the operating system directly.
 *
 * 3. similar to how JS does it on the browser but instead of using browser APIs to
 *    make network requests or timers (setTimeout, setInterval), Libuv provides
 *    us similar APIs that talk directly with the operating system, for network
 *    requests Libuv does a system call telling the operating system to handle it
 *    keeping the main thread undistrubed. for timers the event loops keeps track
 *    of them in a queue and checks on each iteration if any are ready to execute
 *    when the timer is over the callback is pushed to the callstack to be executed,
 *    while the timers are still counting the call stack is free to execute whatever
 *    needs to be executed. for file read/write operations, not all operating systems
 *    support async file IO, so Libuv uses the thread pool to assign worker threads
 *    to read/write files, without blocking the main thread and when it's done it
 *    notifies the main thread.
 *
 * 4. the call stack is where javascript code actually gets executed on the main thread
 *    when a function is called it's block of code is pushed to the stack and when the
 *    function is done it leaves the stack.
 *    the event queue is where callbacks that are ready to be executed are lined up
 *    waiting for the event loop to move to the stack to get executed based on it's
 *    priority, so when a timer is done, it's callback can't immediatly get pushed on
 *    the stack because it might be running something, instead it waits in the event
 *    queue waiting for the event loop to move it to the call stack to be executed.
 *    the event loops doesn't execute code, it determines which code runs first by
 *    continously checking if the callstack is empty, if yes it checks if there are
 *    callbacks waiting in the event queue, if yes it moves them on by on to the stack
 *    to be executed.
 *
 * 5. the thread pool is a group of worker threads libuv provides to run async code
 *    to prevent suffocating the main thread since JS is single threaded.
 *    the thread pool by default provides 4 threads, the size is set by changing the
 *    value of an enviroment variable right as we execute the 'node --watch main.js'
 *    the enviroment variable is UV_THREADPOOL_SIZE=8, so:
 *    env $UV_THREADPOOL_SIZE=8 node --watch main.js
 *
 * 6. when a file operation is done, instead of blocking the main thread waiting for
 *    the contents of the file to be read, we sideload it to one of the worker threads
 *    provided by the libuv's thread pool, when a network request is done, libuv makes
 *    a system call and asks the operating system to handle it on a completely
 *    different thread without blocking the main thread nor using any of the threads
 *    in the thread pool.
 */
