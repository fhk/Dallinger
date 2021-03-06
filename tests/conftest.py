import os
import pytest


@pytest.fixture(scope='session', autouse=True)
def subprocess_coverage():
    # Set env var to trigger starting coverage for subprocesses
    coverage_path = os.path.dirname(os.path.dirname(__file__))
    os.environ['COVERAGE_PROCESS_START'] = os.path.join(coverage_path, '.coveragerc')
    os.environ['COVERAGE_FILE'] = os.path.join(coverage_path, '.coverage')


# This fixture is used automatically and ensures that
# the current working directory is reset if other test classes changed it.
@pytest.fixture(scope="class")
def cwd():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    os.chdir(root)


@pytest.fixture(scope='class', autouse=True)
def reset_config():
    yield

    # Make sure dallinger_experiment module isn't kept between tests
    import sys
    if 'dallinger_experiment' in sys.modules:
        del sys.modules['dallinger_experiment']

    # Make sure extra parameters aren't kept between tests
    from dallinger.config import configurations
    if hasattr(configurations, 'config'):
        del configurations.config


@pytest.fixture
def aws_creds():
    from dallinger.config import get_config
    config = get_config()
    if not config.ready:
        config.load_config()
    creds = {
        'aws_access_key_id': config.get('aws_access_key_id'),
        'aws_secret_access_key': config.get('aws_secret_access_key')
    }
    return creds
