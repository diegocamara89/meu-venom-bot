// src/routes/backup.js
const express = require('express');
const router = express.Router();
const backupSystem = require('../utils/backup');

// Inicializar sistema de backup
backupSystem.init();

// Criar backup
router.post('/create', async (req, res) => {
    try {
        const result = await backupSystem.createBackup();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Restaurar backup
router.post('/restore/:backupId', async (req, res) => {
    try {
        const result = await backupSystem.restoreBackup(req.params.backupId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Listar backups
router.get('/list', async (req, res) => {
    try {
        const backups = await backupSystem.listBackups();
        res.json(backups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;