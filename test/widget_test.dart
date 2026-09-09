import 'package:flutter_test/flutter_test.dart';
import 'package:vakilchee/main.dart';

void main() {
  testWidgets('Vakilchee app renders', (tester) async {
    await tester.pumpWidget(const VakilcheeApp());

    expect(find.text('وکیل‌چی'), findsOneWidget);
    expect(find.text('پلتفرم حقوقی و قضایی وکیل‌چی'), findsOneWidget);
  });
}
