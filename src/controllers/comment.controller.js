'use strict'

const CommentService = require('../services/comment.service')
const { SuccessResponse } = require('../core/success.response')

class CommentController {
    createComment = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create comment successfully',
            metadata: await CommentService.createComment(req.body)
        }).send(res)
    }

    getListComment = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list comment successfully',
            metadata: await CommentService.getListCommentsByParentId(req.query)
        }).send(res)
    }
}

module.exports = new CommentController()
// Compare this snippet from src/routes/comment.route.js: