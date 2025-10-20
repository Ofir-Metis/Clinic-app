"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_simple_module_1 = require("./app-simple.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    try {
        const app = await core_1.NestFactory.create(app_simple_module_1.AppSimpleModule);
        app.enableCors({
            origin: ['http://localhost:5173', 'http://localhost:3000'],
            credentials: true
        });
        const port = process.env.PORT || 4000;
        await app.listen(port, '0.0.0.0');
        logger.log(`🚀 Simple API Gateway running on port ${port}`);
        logger.log(`🎯 Available endpoints:`);
        logger.log(`   GET  /health - Health check`);
        logger.log(`   GET  /status - System status`);
        logger.log(`   ALL  /api/* - Proxy to microservices`);
    }
    catch (error) {
        logger.error('Failed to start API Gateway:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main-simple.js.map