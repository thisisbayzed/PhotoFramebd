import { Request, Response } from "express";
import { Testimonial } from "../models/Testimonial";

const formatTestimonial = (testimonial: InstanceType<typeof Testimonial>) => ({
  id: testimonial._id,
  name: testimonial.name,
  text: testimonial.text,
  createdAt: testimonial.createdAt,
  updatedAt: testimonial.updatedAt,
});

export const createTestimonial = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, text } = req.body;

    if (!name || !text) {
      res.status(400).json({
        success: false,
        message: "Name and text are required",
      });
      return;
    }

    const testimonial = await Testimonial.create({
      name: String(name).trim(),
      text: String(text).trim(),
    });

    res.status(201).json({
      success: true,
      message: "Testimonial added successfully",
      data: formatTestimonial(testimonial),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getTestimonials = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: testimonials.map(formatTestimonial),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const getTestimonialById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatTestimonial(testimonial),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const updateTestimonial = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, text } = req.body;

    if (!name || !text) {
      res.status(400).json({
        success: false,
        message: "Name and text are required",
      });
      return;
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      {
        name: String(name).trim(),
        text: String(text).trim(),
      },
      { new: true }
    );

    if (!testimonial) {
      res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Testimonial updated successfully",
      data: formatTestimonial(testimonial),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

export const deleteTestimonial = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};
