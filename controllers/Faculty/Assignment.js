const route = require("express").Router();
const multer = require("multer");
const role = require("../../middleware/Role");

const Assignment_Faculty = require("../../models/Assignment_Faculty");
const Assignment_Student = require("../../models/Assignment_Student");
const Faculty = require("../../models/Faculty");

// SET STORAGE
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads/Assignment/Faculty/");
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`)
    }
});

const upload = multer({ storage: storage });

route.get("/Availble_Assignment", role(), async (req, res) => {
    try {
        const savedpost = await Assignment_Faculty
            .find({ Faculty_ID: req.user._id, Is_Submitted: false })
            .populate("Sub_ID");

        res.json(savedpost);
    } catch (err) {
        res.json({ Error: err });
    }
});

route.get("/Submited_Assignment", role(), async (req, res) => {
    try {
        let Assignment_Faculty_Ids = await Assignment_Faculty.find({ Faculty_ID: req.user._id, Is_Submitted: true })
        Assignment_Faculty_Ids = Assignment_Faculty_Ids.map(item => item._id);

        const savedpost = await Assignment_Student
            .find({ AssignmentFaculty_ID: Assignment_Faculty_Ids })
            .populate([{
                path: "AssignmentFaculty_ID",
                populate: {
                    path: 'Sub_ID',
                    select: 'Sub_Name'
                }
            }, { path: "Student_ID", select: 'Name' }]);

        res.json(savedpost);
    } catch (err) {
        res.json({ Error: err });
    }
});

route.post("/", [role(), upload.single("Asmt_file")], async (req, res) => {
    try {
        const savedpost = await Faculty.findOne({ _id: req.user._id }).select("-Face_Data")
        req.body.Course_id = savedpost.Course_id
        req.body.Faculty_ID = req.user._id
        req.body.Asmt_file = `http://localhost:8050/Assignment/Faculty/${req.file.filename}`
        await new Assignment_Faculty({
            ...req.body
        }).save();

        res.json({ Success: `${req.baseUrl.split("/")[2]} Are Submited` });
    } catch (err) {
        console.log(err)
        res.json({ Error: err });
    }
});


route.put("/", role(), async (req, res) => {
    try {
        const savedpost = await Assignment_Faculty.findOneAndUpdate(
            { _id: req.body._id },
            { $set: { ...req.body } }
        );

        if (savedpost)
            return res
                .status(200)
                .json({ Success: `${req.baseUrl.split("/")[2]} Are Updated` });

        return res
            .status(400)
            .json({ Error: `${req.baseUrl.split("/")[2]} Are Not Updated` });
    } catch (error) {
        res.json({ Error: error.message });
    }
});

route.delete("/", role(), async (req, res) => {
    const { _id } = req.query;
    if (!_id) return res.json({ Error: "_id is Required to Delete" });
    try {
        const savedpost = await Assignment_Faculty.deleteOne({ _id });

        if (savedpost.n)
            return res
                .status(200)
                .json({ Success: `${req.baseUrl.split("/")[2]} Are Deleted` });

        res
            .status(400)
            .json({ Error: `${req.baseUrl.split("/")[2]} Are Not Deleted` });
    } catch (error) {
        res.json({ Error: error.message });
    }
});

module.exports = route;
