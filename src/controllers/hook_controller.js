import HookService from "../services/hook_service.js";

class HookController {
    async getHooks(req, res, next) {
        try {
            const result = await HookService.getAll(req.query);

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    async getHookById(req, res, next) {
        try {
            const hook = await HookService.getById(req.params.id);

            res.json({
                success: true,
                data: hook,
            });
        } catch (error) {
            next(error);
        }
    }

    async createHook(req, res, next) {
        try {
            const hook = await HookService.create(req.body);

            res.status(201).json({
                success: true,
                message: "Hook created successfully",
                data: hook,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateHook(req, res, next) {
        try {
            const hook = await HookService.update(req.params.id, req.body);

            res.json({
                success: true,
                message: "Hook updated successfully",
                data: hook,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteHook(req, res, next) {
        try {
            await HookService.delete(req.params.id);

            res.json({
                success: true,
                message: "Hook deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new HookController();
