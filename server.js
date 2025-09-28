const express = require('express');
const app = express();
const port = 8080;
// getting-started.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  registration_date: {
    type: Date,
    default: Date.now
  }
})

const BlogPostSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  creation_date: {
    type: Date,
    default: Date.now
  },
  categories: String
})

const CommentSchema = new mongoose.Schema({
  reference_to_User: String,
  text: String,
  reference_to_BlogPost: String,
  creation_date: {
    type: Date,
    default: Date.now
  }
})

//不指定collection的话会自动转成小写复数
const User = mongoose.model('user', UserSchema, 'users');
const Blog = mongoose.model('blog', BlogPostSchema, 'blogs');
const Comment = mongoose.model('comment', CommentSchema, 'comments');

// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Middleware to serve static files from a directory
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Hello World from Express.js!');
});

//注册
//regist
app.post('/regist', async (req, res) => {
  try {
    // console.log(req.body)
    const newUser = new User(req.body);
    const saveData = await newUser.save();
    res.status(201).json({ message: 'user created', user: saveData })
  }
  catch (err) {
    console.log(err)
    res.status(500).json({ err: 'Fail to create user' })
  }
})

//登录
//login
app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username })
    if (!user) {
      return res.status(401).json({ message: "user dose not exist" })
    }
    if (user.password !== req.body.password) {
      return res.status(401).json({ message: "wrong password" })
    }
    return res.status(200).json({ message: "login successfuc" })
  }
  catch (err) {
    console.log(err)
    res.status(500).json({ message: "fail to login" }
    )
  }
})

//验证
//Authenticate
app.use(async (req, res, next) => {
  try {
    if (req.path == '/regist' || req.path == 'login') {
      return next()
    }
    //await Authenticate(req, res, next);
    const authHeader = req.headers['authorization']
    if (!authHeader) {
      return res.status(401).json({ message: 'missing authorization' })
    }
    //example:Authorization:Basic 123123123
    const base64 = authHeader.split(' ')[1]
    const [username, password] = Buffer.from(base64, 'base64').toString().split(':')
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(401).json({ message: "user dose not exist" })
    }
    if (user.password !== password) {
      return res.status(401).json({ message: "wrong password" })
    }
    req.user = user;
    console.log('Authenticate user:', user)
    next()
  }
  catch (err) {
    console.log(err)
    res.status(500).json({ message: "fail to login" }
    )
  }
})

// app.post('/postBlogs', ...)       // 新建
// app.get('/postBlogs', ...)        // 查询所有 (可带过滤)
// app.get('/postBlogs/:id', ...)    // 查询单个
// app.put('/postBlogs/:id', ...)    // 更新某个
// app.delete('/postBlogs/:id', ...) // 删除某个

//创造文章
//creat
app.post('/postBlogs', async (req, res) => {
  try {
    const PostBlog = new Blog(req.body);
    const saveData = await PostBlog.save();
    res.status(201).json({ message: 'blog posted', blog: saveData })
  }
  catch (err) {
    console.log(err)
    res.status(500).json({ err: 'Fail to post blog' })
  }
})

// app.get('/postBlogs/:id?', async (req, res) => {
let getBlogs = async (req, res) => {
  try {
    if (req.params.id) {
      const posted = await Blog.findById(req.params.id);
      if (!posted) return res.status(404).json({ message: 'not found' });
      return res.json(posted)
    } else {
      const { title,
        content,
        author,
        creation_date,
        categories } = req.query
      const filter = {}
      if (title) filter.title = title;
      if (content) filter.content = content;
      if (author) filter.author = author;
      if (creation_date) filter.creation_date = creation_date;
      if (categories) filter.categories = categories;
      const posted = await Blog.find(filter);
      return res.status(200).json(posted)
    }
  }
  catch (err) {
    console.log(err)
    res.status(500).json({ err: 'Fail to get blog' })
  }
}
app.get('/postBlogs', getBlogs);
//注意是params，postman里不要写query params，直接改url,xxx/id
app.get('/postBlogs/:id', getBlogs);

app.put('/postBlogs/:id', async (req, res) => {
  try {
    const updated = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,   // 返回更新后的文档
      runValidators: true // 让 Mongoose 按 Schema 校验
    });
    if (!updated) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(200).json({
      message: 'Blog updated',
      blog: updated
    });
  }
  catch (err) {
    console.log(err)
    res.status(500).json({ err: 'Fail to update blog' })
  }
})

app.delete('/postBlogs/:id', async (req, res) => {
  try {
    const updated = await Blog.findByIdAndDelete(req.params.id);
    if (!updated) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(200).json({
      message: 'Blog deleted',
      // blog: updated
    });
  }
  catch (err) {
    console.log(err)
    res.status(500).json({ err: 'Fail to delete blog' })
  }
})
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/backend_db');
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
  console.log('mongodb connected');
  app.listen(port, () => {
    console.log(`Express server running at http://localhost:${port}`);
  });

}

