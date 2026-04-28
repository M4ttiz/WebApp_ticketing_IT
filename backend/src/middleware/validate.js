// ============================================
// Validation Middleware — express-validator wrapper
// ============================================

const { validationResult } = require('express-validator');

/**
 * Middleware that checks express-validator results
 * and returns 400 with errors if validation failed.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // #region agent log
    fetch('http://127.0.0.1:7715/ingest/c0d27ced-16c6-45ed-94f5-165834a5a336',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d042ee'},body:JSON.stringify({sessionId:'d042ee',runId:'pre-fix',hypothesisId:'H-VAL-1',location:'validate.js:15',message:'Validation middleware rejected request',data:{method:req.method,path:req.originalUrl,errorCount:errors.array().length,fields:errors.array().map((e)=>e.path)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return res.status(400).json({
      error: 'Errore di validazione',
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

module.exports = { validate };
