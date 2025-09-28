// seed.js
const mongoose = require('mongoose');
const { User, Blog, Comment } = require('./server');
const bcrypt = require('bcrypt');

(async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/backend_db');
        await Promise.all([User.deleteMany({}), Blog.deleteMany({}), Comment.deleteMany({})]);
        const hashedPassword = await bcrypt.hash('123456', 10);

        const u1 = await User.create({ username: 'a111', password: hashedPassword, email: 'a111@x.com' });
        const u2 = await User.create({ username: 'b111', password: hashedPassword, email: 'b111@x.com' });

        const b1 = await Blog.create({ title: 'Hello', content: 'world', author: u1._id, categories: 'tech' });
        const b2 = await Blog.create({ title: 'News', content: 'today', author: u2._id, categories: 'life' });

        await Comment.create({ reference_to_User: u2._id, text: 'Nice post', reference_to_BlogPost: b1._id });
        await Comment.create({ reference_to_User: u1._id, text: 'Thanks!', reference_to_BlogPost: b1._id });

        console.log('Seed done');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
