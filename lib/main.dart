import 'package:flutter/material.dart';

void main() {
  runApp(const VakilcheeApp());
}

class VakilcheeApp extends StatelessWidget {
  const VakilcheeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'وکیل‌چی',
      debugShowCheckedModeBanner: false,
      locale: const Locale('fa', 'IR'),
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: child ?? const SizedBox.shrink(),
        );
      },
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Vazirmatn',
        colorSchemeSeed: Colors.indigo,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('وکیل‌چی'),
        centerTitle: true,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.gavel_rounded, size: 72),
              const SizedBox(height: 20),
              Text(
                'پلتفرم حقوقی و قضایی وکیل‌چی',
                style: Theme.of(context).textTheme.headlineSmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              const Text(
                'نسخه Flutter پروژه آماده اجراست.',
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
