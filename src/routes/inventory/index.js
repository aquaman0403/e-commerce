'use strict'
const express = require("express")
const inventoryController = require("../../controllers/inventory.controller")
const router = express.Router()
const asyncHandler = require("../../helpers/asyncHandler")
const { authenticationV2 } = require("../../auth/authUtils")

router.use(authenticationV2)
router.post('/', asyncHandler(inventoryController.addStockToInventory))

module.exports = router;