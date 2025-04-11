'use strict'

const { NotFoundError } = require('../core/error.response')
const { Comment } = require('../models/comment.model')
const { findProduct } = require('../models/repositories/product.repo')
const { convertToObjectIdMongodb } = require('../utils/index')

/*
    key features: Comment service
    + add comment [User | Shop]
    + get list comments [User | Shop]
    + delete comment [User | Shop | Admin]
*/

class CommentService {
    static async createComment({
        productId, userId, content, parentCommentId = null
    }) {
        const comment = new Comment({
            comment_productId: productId,
            comment_userId: userId,
            comment_content: content,
            comment_parentId: parentCommentId
        })

        let rightValue
        if (parentCommentId) {
            // Reply to a comment
            const parentComment = await Comment.findById(parentCommentId).lean()
            if (!parentComment) {
                throw new NotFoundError('Parent comment not found')
            }
            rightValue = parentComment.comment_right
            // Update many comments
            await Comment.updateMany({
                comment_productId: convertToObjectIdMongodb(productId),
                comment_right: { $gte: rightValue }
            }, {
                $inc: {
                    comment_right: 2
                }
            })
            await Comment.updateMany({
                comment_productId: convertToObjectIdMongodb(productId),
                comment_left: { $gt: rightValue }
            }, {
                $inc: {
                    comment_left: 2
                }
            })

        } else {
            const maxRigthValue = await Comment.findOne({
                comment_productId: convertToObjectIdMongodb(productId),
            }, 'comment_right').sort({ comment_right: -1 }).lean()

            if (maxRigthValue) {
                rightValue = maxRigthValue.comment_right + 1
            } else {
                rightValue = 1
            }
        }

        // Insert Comment
        comment.comment_left = rightValue
        comment.comment_right = rightValue + 1

        await comment.save()

        return comment
    }

    static async getListCommentsByParentId({ productId, parentCommentId = null, limit = 50, offset = 0 }) {
        if (parentCommentId) {
            const parent = await Comment.findById(parentCommentId)
            if (!parent) {
                throw new NotFoundError('Parent comment not found')
            }

            const comments = await Comment.find({
                comment_productId: convertToObjectIdMongodb(productId),
                comment_left: { $gt: parent.comment_left },
                comment_right: { $lte: parent.comment_right },
            }).select({
                comment_left: 1,
                comment_right: 1,
                comment_content: 1,
                comment_parentId: 1,
            }).sort({
                comment_left: 1
            })

            return comments
        }

        const comments = await Comment.find({
            comment_productId: convertToObjectIdMongodb(productId),
            comment_parentId: parentCommentId,
        }).select({
            comment_left: 1,
            comment_right: 1,
            comment_content: 1,
            comment_parentId: 1,
        }).sort({
            comment_left: 1
        })

        return comments
    }

    static async deleteComment({
        commentId, productId
    }) {
        // Check product exist in database
        const foundProduct = await findProduct({
            product_id: productId
        })

        if (!foundProduct) {
            throw new NotFoundError('Product not found')
        }
        // 1. Xac dinh gia tri left right
        const comment = await Comment.findById(commentId)
        if (!comment) {
            throw new NotFoundError('Comment not found')
        }
        const leftValue = comment.comment_left
        const rightValue = comment.comment_right

        // 2. Tinh width
        const width = rightValue - leftValue + 1

        // 3. Xoa comment
        await Comment.deleteMany({
            comment_productId: convertToObjectIdMongodb(productId),
            comment_left: { $gte: leftValue, $lte: rightValue },
        })

        // 4. Cap nhat lai left right cho cac comment con lai
        await Comment.updateMany({
            comment_productId: convertToObjectIdMongodb(productId),
            comment_right: { $gt: rightValue }
        }, {
            $inc: {
                comment_right: -width
            }
        })

        await Comment.updateMany({
            comment_productId: convertToObjectIdMongodb(productId),
            comment_left: { $gt: rightValue }
        }, {
            $inc: {
                comment_left: -width
            }
        })

        return true
    }
}

module.exports = CommentService