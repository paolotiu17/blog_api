import { IUser } from './../models/User';
import { Blog, User, Message } from '../models/Models';
import { json, RequestHandler } from 'express';
import {} from './';
import {} from 'mongoose';

//passport
import passport from 'passport';

export const getAllBlogs: RequestHandler = (req, res, next) => {
    Blog.find({}).exec((err, docs) => {
        if (err) res.status(400).json({ error: err.message });
        res.json(docs);
    });
};

export const postBlog: RequestHandler[] = [
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        const { title, text } = req.body;

        // Check if user exist / Sanity check
        if (!req.user) {
            return res.status(403).json({ error: "User doesn't exists" });
        }
        const blog = new Blog({
            title,
            text,
            timestamp: new Date(),
            author: (req.user as IUser)._id,
        });

        blog.save((err, doc) => {
            if (err) return res.status(400).json({ error: err.message });
            return res.json(doc);
        });
    },
];

export const updateBlog: RequestHandler[] = [
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        const { id } = req.params;
        const { title, text } = req.body;

        // Check if user exist / Sanity check
        if (!req.user) {
            return res.status(403).json({ error: "User doesn't exists" });
        }

        const update = {
            title,
            text,
        };

        Blog.findOneAndUpdate({ _id: id }, { text: text, title }).exec();
    },
];

export const deleteBlog: RequestHandler[] = [
    passport.authenticate('jwt', { session: false }),
    (req, res, next) => {
        // Check if user exist / Sanity check
        if (!req.user) {
            return res.status(403).json({ error: "User doesn't exists" });
        }
        const { id } = req.params;
        Blog.findByIdAndRemove(id).exec((err, blog) => {
            if (err) return res.status(400).json(err);
            if (!blog) {
                return res.status(404).json({ error: 'Blog not found' });
            } else {
                if (blog.author !== (req.user as IUser)._id) {
                    return res.status(403).json({ error: 'Not Authorized' });
                } else {
                    return res.json({ message: 'Success', blog });
                }
            }
        });
    },
];

export const getBlogById: RequestHandler = (req, res, next) => {
    const { id } = req.params;
    Blog.findById(id)
        .populate('comments')
        .exec((err, blog) => {
            if (err) return res.status(400).json({ error: err.message });
            if (blog) {
                return res.json(blog);
            } else {
                return res.status(404).json('{error: Blog not found}');
            }
        });
};

export const commentOnBlog: RequestHandler = (req, res) => {
    const { author, text } = req.body;
    const blogId = req.params.id;

    const comment = new Message({
        author,
        text,
        timestamp: new Date(),
    });

    comment.save((err, doc) => {
        if (err) return res.status(400).json({ error: err.message });
        Blog.findByIdAndUpdate(blogId, {
            $push: { comments: doc._id },
        }).exec((err, blog) => {
            if (err) return res.status(400).json({ error: err.message });
            return res.json(doc);
        });
    });
};
