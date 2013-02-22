
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Way2Health Log Viewer' });
};