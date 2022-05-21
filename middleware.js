module.exports = {
  updatetransaction: function (req, res, next) {
    const senderbyid = await customers.findById(req.params.id);
    console.log(senderbyid);
    // res.redirect("/posts");
    next();
  },
};
