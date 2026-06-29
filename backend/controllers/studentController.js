const Student = require("../models/Student");

const handleStudentError = (res, err) => {
  if (err.code === 11000) {
    return res.status(400).json({
      message: "A student with this email already exists.",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(err.errors)
        .map((error) => error.message)
        .join(" "),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid student id.",
    });
  }

  return res.status(500).json({
    message: err.message,
  });
};

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find();

    res.json(students);
  } catch (err) {
    handleStudentError(res, err);
  }
};

exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.json(student);
  } catch (err) {
    handleStudentError(res, err);
  }
};

exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);

    res.status(201).json(student);
  } catch (err) {
    handleStudentError(res, err);
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.json(student);
  } catch (err) {
    handleStudentError(res, err);
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.json({
      message: "Student Deleted Successfully",
    });
  } catch (err) {
    handleStudentError(res, err);
  }
};
