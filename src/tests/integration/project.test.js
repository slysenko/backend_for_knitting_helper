import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import Project from "../../models/project.js";
import Yarn from "../../models/yarn.js";

describe("POST /api/projects - Create Project", () => {
    describe("Success Cases", () => {
        describe("POST cases", () => {
            it("should create a project with minimal required fields", async () => {
                const projectData = {
                    name: "My First Sweater",
                    projectType: "knitting",
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Project created successfully");
                expect(response.body.data).toHaveProperty("_id");
                expect(response.body.data.name).toBe("My First Sweater");
                expect(response.body.data.projectType).toBe("knitting");
                expect(response.body.data.status).toBe("active");

                const projectInDb = await Project.findById(response.body.data._id);
                expect(projectInDb).not.toBeNull();
                expect(projectInDb.name).toBe("My First Sweater");
            });

            it("should create a project with all optional fields", async () => {
                const projectData = {
                    name: "Summer Cardigan",
                    comments: "Using a beautiful lace pattern",
                    projectType: "knitting",
                    status: "active",
                    startDate: "2024-01-15T00:00:00.000Z",
                    completionDate: "2024-03-20T00:00:00.000Z",
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.name).toBe("Summer Cardigan");
                expect(response.body.data.comments).toBe("Using a beautiful lace pattern");
                expect(response.body.data.status).toBe("active");
                expect(response.body.data.startDate).toBe("2024-01-15T00:00:00.000Z");
                expect(response.body.data.completionDate).toBe("2024-03-20T00:00:00.000Z");
            });

            it("should create a crochet project", async () => {
                const projectData = {
                    name: "Granny Square Blanket",
                    projectType: "crochet",
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.data.projectType).toBe("crochet");
            });

            it("should create a project with yarnsUsed", async () => {
                const yarn = new Yarn({
                    brand: "Malabrigo",
                    name: "Rios",
                });
                await yarn.save();

                const projectData = {
                    name: "Cozy Hat",
                    projectType: "knitting",
                    yarnsUsed: [
                        {
                            yarn: yarn._id.toString(),
                            isPrimary: true,
                            quantityUsed: 2,
                            quantityUnit: "skeins",
                            costPerUnit: 12.99,
                        },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.data.yarnsUsed).toHaveLength(1);
                expect(response.body.data.yarnsUsed[0].yarn._id).toBe(yarn._id.toString());
                expect(response.body.data.yarnsUsed[0].isPrimary).toBe(true);
                expect(response.body.data.yarnsUsed[0].quantityUsed).toBe(2);
                expect(response.body.data.primaryYarn).toBeDefined();
                expect(response.body.data.primaryYarn.yarn._id).toBe(yarn._id.toString());
            });

            it("should trim whitespace from project name", async () => {
                const projectData = {
                    name: "  Trimmed Name  ",
                    projectType: "knitting",
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.data.name).toBe("Trimmed Name");
            });

            it("should create project with different status values", async () => {
                const statuses = ["active", "completed", "frogged", "hibernating"];

                for (const status of statuses) {
                    const projectData = {
                        name: `Project ${status}`,
                        projectType: "knitting",
                        status: status,
                    };

                    const response = await request(app).post("/api/projects").send(projectData).expect(201);

                    expect(response.body.data.status).toBe(status);
                }
            });

            it("should create a project with multiple yarnsUsed", async () => {
                const yarn1 = await Yarn.create({ name: "Yarn 1", brand: "Brand A" });
                const yarn2 = await Yarn.create({ name: "Yarn 2", brand: "Brand B" });

                const projectData = {
                    name: "Multi-Yarn Project",
                    projectType: "knitting",
                    yarnsUsed: [
                        {
                            yarn: yarn1._id.toString(),
                            isPrimary: true,
                            quantityUsed: 2,
                            quantityUnit: "skeins",
                            costPerUnit: 12.99,
                            currency: "USD",
                        },
                        {
                            yarn: yarn2._id.toString(),
                            quantityUsed: 1,
                            quantityUnit: "balls",
                            costPerUnit: 8.5,
                            currency: "EUR",
                        },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.yarnsUsed).toHaveLength(2);
                expect(response.body.data.yarnsUsed[0].yarn.name).toBe("Yarn 1");
                expect(response.body.data.yarnsUsed[0].quantityUsed).toBe(2);
                expect(response.body.data.yarnsUsed[0].isPrimary).toBe(true);
                expect(response.body.data.yarnsUsed[1].yarn.name).toBe("Yarn 2");
                expect(response.body.data.yarnsUsed[1].isPrimary).toBe(false);
            });

            it("should create a project without yarnsUsed (empty array)", async () => {
                const projectData = {
                    name: "No Yarn Project",
                    projectType: "knitting",
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.yarnsUsed).toEqual([]);
            });
        });

        describe("GET cases", () => {
            it("should return an empty array when no projects exist", async () => {
                const response = await request(app).get("/api/projects");

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual([]);
                expect(response.body.count).toBe(0);
            });

            it("should return all projects", async () => {
                await Project.create([
                    { name: "Project 1", projectType: "knitting" },
                    { name: "Project 2", projectType: "crochet" },
                ]);

                const response = await request(app).get("/api/projects");

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.count).toBe(2);
                expect(response.body.data.map((p) => p.name)).toContain("Project 1");
                expect(response.body.data.map((p) => p.name)).toContain("Project 2");
            });

            it("should filter projects by projectType", async () => {
                await Project.create([
                    { name: "Knitting Project", projectType: "knitting" },
                    { name: "Crochet Project", projectType: "crochet" },
                ]);

                const response = await request(app).get("/api/projects?projectType=knitting");

                expect(response.status).toBe(200);
                expect(response.body.count).toBe(1);
                expect(response.body.data[0].name).toBe("Knitting Project");
            });

            it("should return a single project by its ID", async () => {
                const project = await Project.create({ name: "Single Project", projectType: "knitting" });

                const response = await request(app).get(`/api/projects/${project._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(project._id.toString());
                expect(response.body.data.name).toBe("Single Project");
            });
        });

        describe("PUT cases", () => {
            it("should update a project successfully", async () => {
                const project = await Project.create({ name: "Original Name", projectType: "knitting" });
                const updateData = { name: "Updated Name", status: "completed" };

                const response = await request(app).put(`/api/projects/${project._id}`).send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(project._id.toString());
                expect(response.body.data.name).toBe("Updated Name");
                expect(response.body.data.status).toBe("completed");
            });
        });

        describe("DELETE cases", () => {
            it("should delete a project successfully", async () => {
                const project = await Project.create({ name: "To Be Deleted", projectType: "crochet" });

                const response = await request(app).delete(`/api/projects/${project._id}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Project deleted successfully");

                const dbProject = await Project.findById(project._id);
                expect(dbProject).toBeNull();
            });
        });
    });

    describe("Validation Failure response", () => {
        describe("POST cases", () => {
            it("should fail when name is missing", async () => {
                const projectData = {
                    projectType: "knitting",
                };

                const responseponse = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(responseponse.body.success).toBe(false);
            });

            it("should fail when projectType is missing", async () => {
                const projectData = {
                    name: "My Project",
                };

                const responseponse = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(responseponse.body.success).toBe(false);
            });

            it("should fail when name is empty string", async () => {
                const projectData = {
                    name: "",
                    projectType: "knitting",
                };

                const responseponse = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(responseponse.body.success).toBe(false);
            });

            it("should fail when name exceeds 200 characters", async () => {
                const projectData = {
                    name: "a".repeat(201),
                    projectType: "knitting",
                };

                const responseponse = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(responseponse.body.success).toBe(false);
            });

            it("should fail when projectType is invalid", async () => {
                const projectData = {
                    name: "My Project",
                    projectType: "weaving", // invalid type
                };

                const responseponse = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(responseponse.body.success).toBe(false);
            });

            it("should fail when status is invalid", async () => {
                const projectData = {
                    name: "My Project",
                    projectType: "knitting",
                    status: "paused", // invalid status
                };

                const responseponse = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(responseponse.body.success).toBe(false);
            });

            it("should fail when completionDate is before startDate", async () => {
                const projectData = {
                    name: "Invalid Dates",
                    projectType: "knitting",
                    startDate: "2024-03-20T00:00:00.000Z",
                    completionDate: "2024-01-15T00:00:00.000Z",
                };

                const responseponse = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(responseponse.body.success).toBe(false);
            });

            it("should fail when yarnsUsed contains invalid yarn ID", async () => {
                const projectData = {
                    name: "My Project",
                    projectType: "knitting",
                    yarnsUsed: [
                        {
                            yarn: "invalid-id-format",
                            quantityUsed: 2,
                        },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when yarnsUsed contains duplicate yarn IDs", async () => {
                const yarn = await Yarn.create({ name: "Test Yarn" });

                const projectData = {
                    name: "Duplicate Yarn Project",
                    projectType: "knitting",
                    yarnsUsed: [
                        { yarn: yarn._id.toString(), quantityUsed: 2 },
                        { yarn: yarn._id.toString(), quantityUsed: 3 },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain("Cannot add the same yarn multiple times");
            });

            it("should fail when multiple yarns are marked as primary", async () => {
                const yarn1 = await Yarn.create({ name: "Yarn 1" });
                const yarn2 = await Yarn.create({ name: "Yarn 2" });

                const projectData = {
                    name: "Multiple Primary Yarns Project",
                    projectType: "knitting",
                    yarnsUsed: [
                        { yarn: yarn1._id.toString(), quantityUsed: 2, isPrimary: true },
                        { yarn: yarn2._id.toString(), quantityUsed: 3, isPrimary: true },
                    ],
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain("Only one yarn can be marked as primary");
            });

            it("should fail when comments exceed 2000 characters", async () => {
                const projectData = {
                    name: "My Project",
                    projectType: "knitting",
                    comments: "a".repeat(2001),
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
            });

            it("should fail when date format is invalid", async () => {
                const projectData = {
                    name: "My Project",
                    projectType: "knitting",
                    startDate: "not-a-date",
                };

                const response = await request(app).post("/api/projects").send(projectData).expect(400);

                expect(response.body.success).toBe(false);
            });
        });

        describe("GET cases", () => {
            it("should return 400 for missing required fields (e.g., name)", async () => {
                const projectData = {
                    projectType: "crochet",
                };

                const response = await request(app).post("/api/projects").send(projectData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Validation error");
                expect(response.body.errors[0].message).toContain('"name" is required');
            });

            it("should return 400 for invalid enum values (e.g., projectType)", async () => {
                const projectData = {
                    name: "Invalid Project",
                    projectType: "sewing",
                };

                const response = await request(app).post("/api/projects").send(projectData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.errors[0].message).toContain('"projectType" must be one of [knitting, crochet]');
            });

            it("should return 400 for invalid query param", async () => {
                const response = await request(app).get("/api/projects?status=on_fire");

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.errors[0].message).toContain('"status" must be one of [active, completed, frogged, hibernating]');
            });

            it("should return 404 for a non-existent project ID", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const response = await request(app).get(`/api/projects/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Project not found");
            });

            it("should return 400 for an invalid project ID", async () => {
                const invalidId = "123-invalid-id";
                const response = await request(app).get(`/api/projects/${invalidId}`);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain(`Invalid _id: ${invalidId}`);
            });
        });

        describe("PUT cases", () => {
            it("should return 400 for invalid update data", async () => {
                const project = await Project.create({ name: "Project", projectType: "knitting" });
                const updateData = { status: "invalid_status" };

                const response = await request(app).put(`/api/projects/${project._id}`).send(updateData);

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.errors[0].message).toContain('"status" must be one of [active, completed, frogged, hibernating]');
            });

            it("should return 404 when updating a non-existent project", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();
                const updateData = { name: "Updated Name" };

                const response = await request(app).put(`/api/projects/${validNonExistentId}`).send(updateData);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Project not found");
            });
        });

        describe("DELETE cases", () => {
            it("should return 404 when deleting a non-existent project", async () => {
                const validNonExistentId = new mongoose.Types.ObjectId();

                const response = await request(app).delete(`/api/projects/${validNonExistentId}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Project not found");
            });
        });
    });

    describe("Database Persistence", () => {
        it("should persist timestamps correctly", async () => {
            const projectData = {
                name: "Timestamp Test",
                projectType: "knitting",
            };

            const response = await request(app).post("/api/projects").send(projectData).expect(201);

            expect(response.body.data).toHaveProperty("createdAt");
            expect(response.body.data).toHaveProperty("updatedAt");

            const createdAt = new Date(response.body.data.createdAt);
            const updatedAt = new Date(response.body.data.updatedAt);

            expect(createdAt).toBeInstanceOf(Date);
            expect(updatedAt).toBeInstanceOf(Date);
        });

        it("should initialize empty arrays for photos, yarnsUsed, and additionalCosts", async () => {
            const projectData = {
                name: "Array Test",
                projectType: "knitting",
            };

            const response = await request(app).post("/api/projects").send(projectData).expect(201);

            const projectInDb = await Project.findById(response.body.data._id);

            expect(Array.isArray(projectInDb.photos)).toBe(true);
            expect(projectInDb.photos.length).toBe(0);
            expect(Array.isArray(projectInDb.yarnsUsed)).toBe(true);
            expect(projectInDb.yarnsUsed.length).toBe(0);
            expect(Array.isArray(projectInDb.additionalCosts)).toBe(true);
            expect(projectInDb.additionalCosts.length).toBe(0);
        });
    });
});
